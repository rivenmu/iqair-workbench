from django.contrib import admin
from .models import DataSnapshot


@admin.register(DataSnapshot)
class DataSnapshotAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'user', 'operation_type', 'is_manual', 'is_large', 'timestamp')
    list_filter = ('operation_type', 'is_manual', 'is_large')
    search_fields = ('note', 'project__name')
    ordering = ('-timestamp',)
    readonly_fields = ('id', 'timestamp')
