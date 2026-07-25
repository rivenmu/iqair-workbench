from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BrandViewSet, DashboardViewSet, PlatformDataViewSet
from .views_cloudword import CloudWordViewSet

router = DefaultRouter()
router.register(r'brands', BrandViewSet, basename='brand')

cloudword_list = CloudWordViewSet.as_view({'get': 'list', 'post': 'create'})
cloudword_detail = CloudWordViewSet.as_view({'get': 'list', 'patch': 'partial_update', 'delete': 'destroy'})

urlpatterns = [
    path('<int:project_pk>/data/', DashboardViewSet.as_view({'get': 'get_data', 'post': 'save_data'}), name='dashboard-data'),
    path('<int:project_pk>/ui-texts/', DashboardViewSet.as_view({'post': 'save_ui_texts'}), name='dashboard-ui-texts'),
    path('<int:project_pk>/', include(router.urls)),
    path('platform/upload/', PlatformDataViewSet.as_view({'post': 'upload_excel'}), name='platform-upload'),
    path('platform/query/', PlatformDataViewSet.as_view({'get': 'query_data'}), name='platform-query'),
    path('platform/range/', PlatformDataViewSet.as_view({'get': 'date_range'}), name='platform-range'),
    path('platform/template/', PlatformDataViewSet.as_view({'get': 'download_template'}), name='platform-template'),
    path('cloud-words/', cloudword_list, name='cloudword-list'),
    path('cloud-words/<int:pk>/', cloudword_detail, name='cloudword-detail'),
]
