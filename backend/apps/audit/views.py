from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import IsAdmin

from .models import OperationLog
from .serializers import OperationLogSerializer


class OperationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """操作日志 ViewSet（只读，不可修改）"""
    serializer_class = OperationLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = OperationLog.objects.all().order_by('-timestamp')
        # 管理员可查看所有日志，普通用户仅查看自己的
        if not self.request.user.is_admin:
            queryset = queryset.filter(user=self.request.user)
        # 支持按模块过滤
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        return queryset
