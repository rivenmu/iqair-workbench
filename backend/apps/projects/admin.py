from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'route', 'icon', 'is_active', 'sort_order', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    list_editable = ('sort_order', 'is_active', 'icon')
    ordering = ('sort_order', '-created_at')
