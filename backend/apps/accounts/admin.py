from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group

from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django_celery_results.models import TaskResult, GroupResult

from .models import User, Role


admin.site.unregister(Group)
admin.site.unregister(OutstandingToken)
admin.site.unregister(BlacklistedToken)
admin.site.unregister(TaskResult)
admin.site.unregister(GroupResult)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'phone', 'last_login', 'last_login_ip', 'created_at')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'phone')
    ordering = ('-created_at',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone', 'last_login_ip')}),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone')}),
    )
