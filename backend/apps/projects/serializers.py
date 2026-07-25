from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'icon',
                  'route', 'thumbnail', 'is_featured', 'gradient_color',
                  'subtitle', 'icon_type', 'icon_emoji',
                  'is_active', 'sort_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectListSerializer(serializers.ModelSerializer):
    """导航页展示用精简序列化器"""

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'icon',
                  'route', 'thumbnail', 'is_featured', 'gradient_color',
                  'subtitle', 'icon_type', 'icon_emoji',
                  'is_active', 'sort_order']
