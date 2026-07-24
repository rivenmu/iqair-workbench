﻿from django.contrib import admin

from .models import WebsiteLink


@admin.register(WebsiteLink)
class WebsiteLinkAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'url', 'is_internal',
                    'is_active', 'sort_order', 'created_at')
    list_filter = ('category', 'is_active', 'is_internal')
    search_fields = ('name', 'description', 'url')
    ordering = ('sort_order', '-created_at')
    list_editable = ('sort_order', 'is_active', 'is_internal')
