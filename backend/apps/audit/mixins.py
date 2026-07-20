"""
AuditLogMixin - 自动记录操作日志的 Mixin
用于 ViewSet，在 create/update/destroy 时自动记录
"""
from rest_framework.response import Response


class AuditLogMixin:
    """
    为 ViewSet 提供自动审计日志记录功能
    """
    audit_module = 'default'

    def get_client_ip(self, request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            return xff.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    def perform_create(self, serializer):
        instance = serializer.save()
        from apps.audit.services import AuditLogService
        AuditLogService.log(
            user_id=self.request.user.id,
            action='create',
            module=self.audit_module,
            target_id=str(instance.id),
            before_data=None,
            after_data=serializer.data,
            ip_address=self.get_client_ip(self.request)
        )
        return instance

    def perform_update(self, serializer):
        old_data = self.get_old_data(serializer.instance)
        instance = serializer.save()
        from apps.audit.services import AuditLogService
        AuditLogService.log(
            user_id=self.request.user.id,
            action='update',
            module=self.audit_module,
            target_id=str(instance.id),
            before_data=old_data,
            after_data=serializer.data,
            ip_address=self.get_client_ip(self.request)
        )
        return instance

    def perform_destroy(self, instance):
        from apps.audit.services import AuditLogService
        old_data = self.get_old_data(instance)
        AuditLogService.log(
            user_id=self.request.user.id,
            action='delete',
            module=self.audit_module,
            target_id=str(instance.id),
            before_data=old_data,
            after_data=None,
            ip_address=self.get_client_ip(self.request)
        )
        instance.delete()

    def get_old_data(self, instance):
        """获取修改前的数据（子类可重写）"""
        from rest_framework import serializers
        if hasattr(self, 'get_serializer_class'):
            serializer_class = self.get_serializer_class()
            try:
                return serializer_class(instance).data
            except Exception:
                return None
        return None
