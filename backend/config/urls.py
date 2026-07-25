from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', include('apps.system_env.urls_health')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/snapshots/', include('apps.snapshots.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/navigation/', include('apps.navigation.urls')),
    path('api/system-env/', include('apps.system_env.urls')),
]

urlpatterns += [
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='v1_token_refresh'),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/projects/', include('apps.projects.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    path('api/v1/snapshots/', include('apps.snapshots.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    path('api/v1/navigation/', include('apps.navigation.urls')),
    path('api/v1/system-env/', include('apps.system_env.urls')),
]

urlpatterns += [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
