from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import SnapshotViewSet

router = DefaultRouter()
router.register(r'', SnapshotViewSet, basename='snapshot')

urlpatterns = [
    path('<int:project_pk>/snapshots/', include(router.urls)),
]
