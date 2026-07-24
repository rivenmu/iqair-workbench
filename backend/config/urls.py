from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from config.celery_app import app as celery_app

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/snapshots/', include('apps.snapshots.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/navigation/', include('apps.navigation.urls')),
    path('api/system-env/', include('apps.system_env.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
