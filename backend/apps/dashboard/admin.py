from django.contrib import admin

from .models import Brand, FilterRevenue, UIText


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'color', 'sort_order', 'created_at')
    list_filter = ('project',)
    search_fields = ('name',)
    ordering = ('sort_order',)

    def get_model_perms(self, request):
        return {}


@admin.register(FilterRevenue)
class FilterRevenueAdmin(admin.ModelAdmin):
    list_display = ('brand', 'period', 'revenue', 'filter_percentage', 'created_at')
    list_filter = ('brand', 'period')
    ordering = ('-period',)

    def get_model_perms(self, request):
        return {}


@admin.register(UIText)
class UITextAdmin(admin.ModelAdmin):
    list_display = ('project', 'key', 'value', 'updated_at')
    list_filter = ('project',)
    search_fields = ('key', 'value')
    ordering = ('project', 'key')

    def get_model_perms(self, request):
        return {}
