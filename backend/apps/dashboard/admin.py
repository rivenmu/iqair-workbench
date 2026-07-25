from django.contrib import admin
from .models import Brand, FilterRevenue, UIText, PlatformSalesData
from .models_cloudword import CloudWord

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'color', 'sort_order', 'created_at')
    list_filter = ('project',)
    search_fields = ('name',)
    ordering = ('sort_order',)

@admin.register(CloudWord)
class CloudWordAdmin(admin.ModelAdmin):
    list_display = ('cn_text', 'en_text', 'weight', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('cn_text', 'en_text')
    list_editable = ('weight', 'is_active')
    ordering = ('-weight',)

@admin.register(FilterRevenue)
class FilterRevenueAdmin(admin.ModelAdmin):
    list_display = ('brand', 'period', 'revenue', 'filter_percentage', 'created_at')
    list_filter = ('brand', 'period')
    ordering = ('-period',)

@admin.register(UIText)
class UITextAdmin(admin.ModelAdmin):
    list_display = ('project', 'key', 'value', 'updated_at')
    list_filter = ('project',)
    search_fields = ('key', 'value')
    ordering = ('project', 'key')

@admin.register(PlatformSalesData)
class PlatformSalesDataAdmin(admin.ModelAdmin):
    list_display = ('platform', 'period_type', 'date', 'sales_amount', 'order_count', 'created_at')
    list_filter = ('platform', 'period_type')
    search_fields = ('date',)
    date_hierarchy = 'date'
    ordering = ('-date',)
    list_per_page = 50
