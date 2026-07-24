from rest_framework import serializers

from .models import WebsiteLink, UserFavorite


def _build_icon_url(obj, request):
    """构建同源图标 URL，避免代理错误地暴露内网主机地址。"""
    if not obj.icon_image:
        return ''
    return f'/api/navigation/links/{obj.id}/icon/'


class WebsiteLinkSerializer(serializers.ModelSerializer):
    """完整序列化器（管理员增删改用）"""
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )
    icon_image = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    def get_icon_image(self, obj):
        return _build_icon_url(obj, self.context.get('request'))

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return UserFavorite.objects.filter(
            user=request.user, website_link=obj
        ).exists()

    class Meta:
        model = WebsiteLink
        fields = ['id', 'name', 'url', 'description', 'icon_image',
                  'icon_emoji', 'category', 'category_display',
                  'is_internal', 'sort_order', 'is_active', 'is_favorited',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class WebsiteLinkListSerializer(serializers.ModelSerializer):
    """列表展示用精简序列化器"""
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )
    icon_image = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    def get_icon_image(self, obj):
        return _build_icon_url(obj, self.context.get('request'))

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return UserFavorite.objects.filter(
            user=request.user, website_link=obj
        ).exists()

    class Meta:
        model = WebsiteLink
        fields = ['id', 'name', 'url', 'description', 'icon_image',
                  'icon_emoji', 'category', 'category_display',
                  'is_internal', 'sort_order', 'is_active', 'is_favorited']
