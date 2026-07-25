import pytest
from apps.snapshots.models import DataSnapshot
from apps.snapshots.services import SnapshotService
from apps.dashboard.models import Brand

class TestSnapshotModels:
    def test_snapshot_creation(self, db, project, admin_user):
        snap = DataSnapshot.objects.create(project=project, user=admin_user, operation_type='update', note='test')
        assert str(snap).startswith('Test Project')
        assert snap.operation_type == 'update'
    def test_snapshot_small_data(self, db, project, admin_user):
        snap = DataSnapshot.objects.create(project=project, user=admin_user, operation_type='update', small_data={'a':1})
        assert snap.small_data == {'a':1}
        assert snap.is_large is False
        assert snap.size_bytes > 0

class TestSnapshotService:
    def test_create_small_snapshot(self, db, project, admin_user):
        data = {'periods':['2024'],'brands':[],'uiTexts':{}}
        snap = SnapshotService.create_snapshot(project.id, admin_user.id, data, 'update')
        assert snap.is_large is False
        assert SnapshotService.get_snapshot_data(snap.id) == data
    def test_restore_snapshot(self, db, project, admin_user):
        # Save initial state
        Brand.objects.create(project=project, name='Initial')
        old_data = {'brands':[{'name':'Initial','color':'#000','logo':'','filterRev':[100],'filterPct':[10],'sort_order':0}],'periods':['2024'],'uiTexts':{}}
        snap = SnapshotService.create_snapshot(project.id, admin_user.id, old_data, 'update')
        # Modify
        Brand.objects.filter(project=project).update(name='Modified')
        # Restore
        SnapshotService.restore_snapshot(snap.id, admin_user, project.id)
        brands = Brand.objects.filter(project=project)
        assert brands.filter(name='Initial').exists()
    def test_get_nonexistent_snapshot(self, db):
        assert SnapshotService.get_snapshot_data('00000000-0000-0000-0000-000000000000') is None
