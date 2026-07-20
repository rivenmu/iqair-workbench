from .models import OperationLog


class AuditLogService:
    """审计日志服务层"""

    @staticmethod
    def log(user_id, action, module, target_id='', before_data=None, after_data=None, ip_address=None):
        """记录操作日志"""
        return OperationLog.objects.create(
            user_id=user_id,
            action=action,
            module=module,
            target_id=target_id,
            before_data=before_data,
            after_data=after_data,
            ip_address=ip_address
        )

    @staticmethod
    def get_user_logs(user_id, limit=100):
        """获取用户的操作记录"""
        return OperationLog.objects.filter(user_id=user_id).order_by('-timestamp')[:limit]

    @staticmethod
    def get_module_logs(module, limit=100):
        """获取某模块的操作记录"""
        return OperationLog.objects.filter(module=module).order_by('-timestamp')[:limit]

    @staticmethod
    def cleanup_old_logs():
        """
        清理旧日志
        保留策略：
        - 7天内：完整保留
        - 7-90天：每天只保留最后一条记录
        - 超过90天：自动删除
        """
        from datetime import timedelta
        from django.utils import timezone
        from django.conf import settings

        now = timezone.now()
        full_keep_days = settings.LOG_FULL_KEEP_DAYS  # 7
        retention_days = settings.LOG_RETENTION_DAYS   # 90

        # 1. 删除超过90天的日志
        cutoff_90 = now - timedelta(days=retention_days)
        OperationLog.objects.filter(timestamp__lt=cutoff_90).delete()

        # 2. 对于7-90天之间的日志，每天只保留最后一条
        cutoff_7 = now - timedelta(days=full_keep_days)
        # 获取7-90天之间的所有日期
        old_logs = OperationLog.objects.filter(
            timestamp__lt=cutoff_7,
            timestamp__gte=cutoff_90
        )

        # 按日期分组，每天只保留最后一条
        seen_dates = set()
        for log in old_logs.order_by('-timestamp'):
            log_date = log.timestamp.date()
            if log_date in seen_dates:
                log.delete()
            else:
                seen_dates.add(log_date)
