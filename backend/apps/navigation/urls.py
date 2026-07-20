from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import WebsiteLinkViewSet, UserFavoriteViewSet

router = DefaultRouter()
router.register(r'links', WebsiteLinkViewSet, basename='website-link')
router.register(r'favorites', UserFavoriteViewSet, basename='user-favorite')

urlpatterns = [
    path('', include(router.urls)),
]
