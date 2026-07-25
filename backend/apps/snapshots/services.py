import json, os, uuid
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from .models import DataSnapshot, OperationType
from apps.audit.services import AuditLogService
from utils.crypto import encrypt_snapshot, decrypt_snapshot

class SnapshotService:
    SIZE_THRESHOLD = 1024 * 1024

    @classmethod
    def create_snapshot(cls, project_id, user_id, data, operation_type=OperationType.UPDATE, is_manual=False, note=''):
        json_str = json.dumps(data, ensure_ascii=False, default=str)
        data_bytes = json_str.encode('utf-8')
        data_size = len(data_bytes)
        snapshot = DataSnapshot(project_id=project_id, user_id=user_id, operation_type=operation_type, is_manual=is_manual, note=note)
        if data_size <= cls.SIZE_THRESHOLD:
            snapshot.small_data = data
            snapshot.is_large = False
        else:
            snapshots_dir = settings.SNAPSHOTS_DIR
            os.makedirs(snapshots_dir, exist_ok=True)
            filename = f'{project_id}_{uuid.uuid4().hex}.enc'
            file_path = os.path.join(snapshots_dir, filename)
            encrypted = encrypt_snapshot(data_bytes)
            with open(file_path, 'wb') as f:
                f.write(encrypted)
            snapshot.file_path = file_path
            snapshot.is_large = True
        snapshot.save()
        AuditLogService.log(user_id=user_id, action='snapshot_create', module='snapshots', target_id=str(snapshot.id), before_data=None, after_data={'project_id': project_id, 'operation': operation_type, 'note': note}, ip_address=None)
        from tasks.cleanup_tasks import cleanup_old_snapshots
        cleanup_old_snapshots.delay()
        return snapshot

    @classmethod
    def get_snapshot_data(cls, snapshot_id):
        try:
            snapshot = DataSnapshot.objects.get(id=snapshot_id)
        except DataSnapshot.DoesNotExist:
            return None
        if snapshot.is_large and snapshot.file_path:
            try:
                with open(snapshot.file_path, 'rb') as f:
                    decrypted = decrypt_snapshot(f.read())
                return json.loads(decrypted.decode('utf-8'))
            except (FileNotFoundError, json.JSONDecodeError, Exception):
                return None
        return snapshot.small_data

    @classmethod
    def restore_snapshot(cls, snapshot_id, user, project_id):
        try:
            snapshot = DataSnapshot.objects.get(id=snapshot_id, project_id=project_id)
        except DataSnapshot.DoesNotExist:
            raise ValueError('snapshot not found')
        if not user.is_admin and snapshot.user_id != user.id:
            raise PermissionError('no permission')
        if snapshot.operation_type == OperationType.RESTORE:
            raise ValueError('cannot re-restore')
        snapshot_data = cls.get_snapshot_data(snapshot_id)
        if snapshot_data is None:
            raise ValueError('snapshot data corrupted')
        from services.dashboard_service import DashboardService
        DashboardService.save_dashboard_data(project_id, snapshot_data, user)
        cls.create_snapshot(project_id=project_id, user_id=user.id, data=snapshot_data, operation_type=OperationType.RESTORE, is_manual=True, note=f'restore to {snapshot.timestamp}')
        return True

    @classmethod
    def cleanup_old_snapshots(cls):
        cutoff_date = timezone.now() - timedelta(days=settings.SNAPSHOT_RETENTION_DAYS)
        old = DataSnapshot.objects.filter(timestamp__lt=cutoff_date)
        for snapshot in old:
            if snapshot.is_large and snapshot.file_path and os.path.exists(snapshot.file_path):
                os.remove(snapshot.file_path)
            snapshot.delete()
        total = DataSnapshot.objects.count()
        if total > settings.SNAPSHOT_RETENTION_COUNT:
            excess = DataSnapshot.objects.order_by('-timestamp')[settings.SNAPSHOT_RETENTION_COUNT:]
            for snapshot in excess:
                if snapshot.is_large and snapshot.file_path and os.path.exists(snapshot.file_path):
                    os.remove(snapshot.file_path)
                snapshot.delete()
