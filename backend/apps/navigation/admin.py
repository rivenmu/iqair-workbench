from django.contrib import admin

from .models import WebsiteLink, UserFavorite


@admin.register(WebsiteLink)
class WebsiteLinkAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'url', 'is_internal',
                    'is_active', 'sort_order', 'created_at')
    list_filter = ('category', 'is_active', 'is_internal')
    search_fields = ('name', 'description', 'url')
    ordering = ('sort_order', '-created_at')
    list_editable = ('sort_order', 'is_active', 'is_internal')


@admin.register(UserFavorite)
class UserFavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'website_link', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'website_link__name')
    ordering = ('-created_at',)

    def get_model_perms(self, request):
        return {}
