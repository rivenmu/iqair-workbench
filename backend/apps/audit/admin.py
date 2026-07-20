from django.contrib import admin
from .models import OperationLog


@admin.register(OperationLog)
class OperationLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'module', 'target_id', 'ip_address', 'timestamp')
    list_filter = ('action', 'module')
    search_fields = ('user__username', 'action', 'module')
    ordering = ('-timestamp',)
    readonly_fields = ('timestamp',)
