from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.audit.mixins import AuditLogMixin
from apps.accounts.permissions import IsAdminOrReadOnly

from .models import Project
from .serializers import ProjectSerializer, ProjectListSerializer


class ProjectViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """项目 ViewSet"""
    queryset = Project.objects.filter(is_active=True).order_by('sort_order', '-created_at')
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
