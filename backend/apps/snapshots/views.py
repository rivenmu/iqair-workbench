from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsOwnerOrAdmin

from .models import DataSnapshot, OperationType
from .serializers import DataSnapshotSerializer, CreateSnapshotSerializer
from .services import SnapshotService


class SnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    """快照管理 ViewSet"""
    serializer_class = DataSnapshotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs['project_pk']
        queryset = DataSnapshot.objects.filter(project_id=project_id)
        if not self.request.user.is_admin:
            queryset = queryset.filter(user=self.request.user)
        return queryset.order_by('-timestamp')

    @action(detail=False, methods=['post'])
    def manual(self, request, project_pk=None):
        """手动创建快照"""
        from services.dashboard_service import DashboardService
        serializer = CreateSnapshotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = DashboardService.get_dashboard_data(project_pk)
        snapshot = SnapshotService.create_snapshot(
            project_id=project_pk,
            user_id=request.user.id,
            data=data,
            operation_type=OperationType.UPDATE,
            is_manual=True,
            note=serializer.validated_data.get('note', '')
        )
        return Response(DataSnapshotSerializer(snapshot).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def restore(self, request, project_pk=None, pk=None):
        """撤销 - 恢复到指定快照"""
        try:
            SnapshotService.restore_snapshot(pk, request.user, project_pk)
            return Response({'detail': '恢复成功'}, status=status.HTTP_200_OK)
        except PermissionError as e:
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
