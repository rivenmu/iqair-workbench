from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView, RegisterView, UserViewSet,
    ChangePasswordView, CurrentUserView, AdminSSOView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('admin-sso/', AdminSSOView.as_view(), name='admin-sso'),
]
