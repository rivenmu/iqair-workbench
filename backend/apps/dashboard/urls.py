from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import BrandViewSet, DashboardViewSet, PlatformDataViewSet

router = DefaultRouter()
router.register(r'brands', BrandViewSet, basename='brand')

platform_data_view = PlatformDataViewSet.as_view({
    'post': 'upload_excel',
    'get': 'query_data',
})

urlpatterns = [
    # 看板数据聚合接口
    path('<int:project_pk>/data/', DashboardViewSet.as_view({'get': 'get_data', 'post': 'save_data'}), name='dashboard-data'),
    # 看板 UI 文本（标题/表头等）轻量保存
    path('<int:project_pk>/ui-texts/', DashboardViewSet.as_view({'post': 'save_ui_texts'}), name='dashboard-ui-texts'),
    # 品牌管理（嵌套在项目下）
    path('<int:project_pk>/', include(router.urls)),
    # 电商平台数据（上传 / 查询 / 日期范围 / 模板下载）
    path('platform/upload/', PlatformDataViewSet.as_view({'post': 'upload_excel'}), name='platform-upload'),
    path('platform/query/', PlatformDataViewSet.as_view({'get': 'query_data'}), name='platform-query'),
    path('platform/range/', PlatformDataViewSet.as_view({'get': 'date_range'}), name='platform-range'),
    path('platform/template/', PlatformDataViewSet.as_view({'get': 'download_template'}), name='platform-template'),
]
