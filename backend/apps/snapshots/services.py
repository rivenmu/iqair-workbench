import json
import os
import uuid
from datetime import timedelta
from django.conf import settings
from django.utils import timezone

from .models import DataSnapshot, OperationType
from apps.audit.services import AuditLogService


class SnapshotService:
    """
    快照服务层 - 混合存储策略
    小数据 (<=1MB) 存入 MySQL 的 small_data 字段
    大数据 (>1MB) 存入文件系统 (data/snapshots/ 目录)
    """

    SIZE_THRESHOLD = 1024 * 1024  # 1MB 阈值

    @classmethod
    def create_snapshot(cls, project_id, user_id, data, operation_type=OperationType.UPDATE,
                        is_manual=False, note=''):
        """创建快照"""
        # 序列化数据
        json_str = json.dumps(data, ensure_ascii=False, default=str)
        data_bytes = json_str.encode('utf-8')
        data_size = len(data_bytes)

        snapshot = DataSnapshot(
            project_id=project_id,
            user_id=user_id,
            operation_type=operation_type,
            is_manual=is_manual,
            note=note
        )

        if data_size <= cls.SIZE_THRESHOLD:
            # 小数据存入 MySQL
            snapshot.small_data = data
            snapshot.is_large = False
        else:
            # 大数据存入文件系统
            snapshots_dir = settings.SNAPSHOTS_DIR
            os.makedirs(snapshots_dir, exist_ok=True)
            filename = f'{project_id}_{uuid.uuid4().hex}.json'
            file_path = os.path.join(snapshots_dir, filename)
            with open(file_path, 'wb') as f:
                f.write(data_bytes)
            snapshot.file_path = file_path
            snapshot.is_large = True

        snapshot.save()

        # 记录审计日志
        AuditLogService.log(
            user_id=user_id,
            action='snapshot_create',
            module='snapshots',
            target_id=str(snapshot.id),
            before_data=None,
            after_data={'project_id': project_id, 'operation': operation_type, 'note': note},
            ip_address=None
        )

        # 触发快照清理任务
        from tasks.cleanup_tasks import cleanup_old_snapshots
        cleanup_old_snapshots.delay()

        return snapshot

    @classmethod
    def get_snapshot_data(cls, snapshot_id):
        """获取快照数据（兼容小数据和大数据）"""
        try:
            snapshot = DataSnapshot.objects.get(id=snapshot_id)
        except DataSnapshot.DoesNotExist:
            return None

        if snapshot.is_large and snapshot.file_path:
            try:
                with open(snapshot.file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                return None
        return snapshot.small_data

    @classmethod
    def restore_snapshot(cls, snapshot_id, user, project_id):
        """
        撤销 - 恢复到指定快照
        限制：仅管理员和该数据所有者可撤销
        """
        try:
            snapshot = DataSnapshot.objects.get(id=snapshot_id, project_id=project_id)
        except DataSnapshot.DoesNotExist:
            raise ValueError('快照不存在')

        # 权限检查
        if not user.is_admin and snapshot.user_id != user.id:
            raise PermissionError('无权撤销此快照')

        # 防止已撤销的操作再次撤销
        if snapshot.operation_type == OperationType.RESTORE:
            raise ValueError('已撤销的操作不可再次撤销')

        # 获取快照数据
        snapshot_data = cls.get_snapshot_data(snapshot_id)
        if snapshot_data is None:
            raise ValueError('快照数据已损坏或丢失')

        # 恢复数据到看板
        from services.dashboard_service import DashboardService
        DashboardService.save_dashboard_data(project_id, snapshot_data, user)

        # 创建一条新的"撤销恢复"操作记录
        cls.create_snapshot(
            project_id=project_id,
            user_id=user.id,
            data=snapshot_data,
            operation_type=OperationType.RESTORE,
            is_manual=True,
            note=f'撤销恢复到: {snapshot.timestamp}'
        )

        return True

    @classmethod
    def cleanup_old_snapshots(cls):
        """
        清理旧快照
        保留策略：最近30天或最近100条记录
        """
        from django.db.models import Q
        cutoff_date = timezone.now() - timedelta(days=settings.SNAPSHOT_RETENTION_DAYS)

        # 删除超过保留天数的快照
        old_snapshots = DataSnapshot.objects.filter(timestamp__lt=cutoff_date)
        for snapshot in old_snapshots:
            # 清理文件系统中的大数据文件
            if snapshot.is_large and snapshot.file_path and os.path.exists(snapshot.file_path):
                os.remove(snapshot.file_path)
            snapshot.delete()

        # 保留最近100条记录
        total_count = DataSnapshot.objects.count()
        if total_count > settings.SNAPSHOT_RETENTION_COUNT:
            excess = DataSnapshot.objects.order_by('-timestamp')[settings.SNAPSHOT_RETENTION_COUNT:]
            for snapshot in excess:
                if snapshot.is_large and snapshot.file_path and os.path.exists(snapshot.file_path):
                    os.remove(snapshot.file_path)
                snapshot.delete()
