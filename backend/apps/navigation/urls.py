from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import WebsiteLinkViewSet

router = DefaultRouter()
router.register(r'links', WebsiteLinkViewSet, basename='website-link')

urlpatterns = [
    path('', include(router.urls)),
]
