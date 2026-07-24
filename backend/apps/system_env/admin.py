from django.contrib import admin
from django.contrib.admin import AdminSite
from django.shortcuts import render

from utils.env_detect import detect_deploy_env
from .models import SyncRecord
from .services import get_latest_sync


@admin.register(SyncRecord)
class SyncRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'trigger', 'status', 'started_at', 'duration_seconds', 'created_at']
    list_filter = ['status', 'trigger']
    readonly_fields = ['trigger', 'status', 'started_at', 'finished_at', 'duration_seconds', 'error_message', 'created_at']
    ordering = ['-started_at']
    change_list_template = 'admin/system_env/syncrecord/change_list.html'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# Hook into SimpleUI home page via settings.SIMPLEUI_HOME_PAGE
# When SIMPLEUI_HOME_PAGE is set to 'system_env_panel', SimpleUI
# renders a custom view. We register a simple view that returns
# the panel template with environment context.


def system_env_panel_view(request):
    """Custom admin home page showing environment info and sync controls."""
    env = detect_deploy_env()
    latest = get_latest_sync()

    context = {
        'is_local': env == 'local',
        'server_host': '10.0.0.6',
        'last_sync_time': latest.started_at.strftime('%Y-%m-%d %H:%M:%S') if latest and latest.started_at else None,
        'sync_status': latest.get_status_display() if latest else 'Idle',
    }

    # Include standard admin context so SimpleUI renders correctly
    # We use AdminSite's each_context to get standard admin template vars
    admin_site = admin.site
    context.update(admin_site.each_context(request))

    return render(request, 'system_env_panel.html', context)
