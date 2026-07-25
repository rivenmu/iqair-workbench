from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.audit.mixins import AuditLogMixin
from apps.accounts.permissions import IsAdminOrReadOnly

from .models import Project
from .serializers import ProjectSerializer, ProjectListSerializer


class ProjectViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """项目 ViewSet — 列表/详情公开访问，写操作需管理员"""
    audit_module = 'projects'
    queryset = Project.objects.filter(is_active=True).order_by('sort_order', '-created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminOrReadOnly()]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
