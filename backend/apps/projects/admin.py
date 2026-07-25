from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_featured', 'route', 'icon_type', 'is_active', 'sort_order', 'created_at')
    list_filter = ('is_active', 'is_featured', 'icon_type')
    search_fields = ('name', 'description', 'subtitle')
    list_editable = ('sort_order', 'is_active', 'is_featured')
    ordering = ('sort_order', '-created_at')
    fieldsets = (
        ('基本信息', {'fields': ('name', 'description', 'subtitle')}),
        ('路由与图标', {'fields': ('route', 'icon', 'icon_type', 'icon_emoji', 'thumbnail')}),
        ('首页展示', {'fields': ('is_featured', 'gradient_color')}),
        ('状态与排序', {'fields': ('is_active', 'sort_order')}),
    )
