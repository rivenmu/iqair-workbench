import pytest
from apps.dashboard.models import Brand, FilterRevenue, UIText, PlatformSalesData
from apps.dashboard.models_cloudword import CloudWord
from services.dashboard_service import DashboardService

class TestDashboardModels:
    def test_brand_creation(self, db, project):
        brand = Brand.objects.create(project=project, name='TestBrand', color='#FF0000')
        assert brand.name == 'TestBrand'
        assert str(brand) == 'TestBrand'
    def test_brand_unique_per_project(self, db, project):
        Brand.objects.create(project=project, name='BrandX')
        with pytest.raises(Exception):
            Brand.objects.create(project=project, name='BrandX')
    def test_filter_revenue_creation(self, db, project):
        brand = Brand.objects.create(project=project, name='B')
        fr = FilterRevenue.objects.create(brand=brand, period='2024 H1', revenue=1000, filter_percentage=50)
        assert fr.revenue == 1000
        assert brand.revenues.count() == 1
    def test_ui_text_upsert(self, db, project):
        UIText.objects.update_or_create(project=project, key='title', defaults={'value': 'Hello'})
        t = UIText.objects.get(project=project, key='title')
        assert t.value == 'Hello'
    def test_platform_sales_data(self, db, admin_user):
        psd = PlatformSalesData.objects.create(
            platform='tmall', period_type='daily', date='2024-01-01',
            sales_amount=50000, order_count=100, uploaded_by=admin_user
        )
        assert psd.get_platform_display() == chr(22825)+chr(29483)
    def test_cloudword_active_default(self, db):
        cw = CloudWord.objects.create(cn_text=chr(27979)+chr(35797)+chr(35789), weight=80)
        assert cw.is_active is True

class TestDashboardService:
    def test_get_empty_dashboard(self, db, project):
        data = DashboardService.get_dashboard_data(project.id)
        assert data['project_id'] == project.id
        assert data['brands'] == []
    def test_save_and_retrieve_data(self, db, project, admin_user):
        payload = {
            'periods': ['2024 H1', '2025 H1'],
            'brands': [
                {'name': 'BrandA', 'color': '#FF0000', 'filterRev': [1000, 2000], 'filterPct': [30, 40], 'logo': ''},
                {'name': 'BrandB', 'color': '#0000FF', 'filterRev': [500, 800], 'filterPct': [10, 15], 'logo': ''},
            ],
            'uiTexts': {'mainTitle': 'Test Dashboard'}
        }
        DashboardService.save_dashboard_data(project.id, payload, admin_user)
        data = DashboardService.get_dashboard_data(project.id)
        assert len(data['brands']) == 2
        assert data['periods'] == ['2024 H1', '2025 H1']
        assert data['uiTexts']['mainTitle'] == 'Test Dashboard'
    def test_upsert_removes_old_brands(self, db, project, admin_user):
        DashboardService.save_dashboard_data(project.id, {
            'periods': ['2024 H1'], 'brands': [{'name': 'Old', 'filterRev': [100], 'filterPct': [10], 'color': '#000', 'logo': ''}], 'uiTexts': {}
        }, admin_user)
        DashboardService.save_dashboard_data(project.id, {
            'periods': ['2024 H1'], 'brands': [{'name': 'New', 'filterRev': [200], 'filterPct': [20], 'color': '#fff', 'logo': ''}], 'uiTexts': {}
        }, admin_user)
        assert Brand.objects.filter(project=project, name='Old').count() == 0
        assert Brand.objects.filter(project=project, name='New').count() == 1
