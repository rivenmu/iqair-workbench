from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'route', 'icon', 'is_featured', 'is_active', 'sort_order', 'created_at')
    list_filter = ('is_active', 'is_featured')
    search_fields = ('name', 'description', 'route')
    list_editable = ('sort_order', 'is_active', 'is_featured', 'icon')
    ordering = ('sort_order', '-created_at')
    fieldsets = (
        (None, {'fields': ('name', 'description', 'route')}),
        ('图标', {'fields': ('icon', 'icon_type', 'thumbnail')}),
        ('首页 Hero 色块', {'fields': ('is_featured', 'gradient_color', 'subtitle')}),
        ('状态', {'fields': ('is_active', 'sort_order')}),
    )
