from rest_framework import serializers

from .models import Brand, FilterRevenue, PlatformSalesData


class FilterRevenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = FilterRevenue
        fields = ['id', 'period', 'revenue', 'filter_percentage']


class BrandSerializer(serializers.ModelSerializer):
    revenues = FilterRevenueSerializer(many=True, read_only=True)

    class Meta:
        model = Brand
        fields = ['id', 'name', 'color', 'logo', 'sort_order', 'revenues', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class BrandListSerializer(serializers.ModelSerializer):
    """列表用精简序列化器"""
    class Meta:
        model = Brand
        fields = ['id', 'name', 'color', 'logo', 'sort_order']


class DashboardDataSerializer(serializers.Serializer):
    """完整看板数据序列化器（用于前端渲染）"""
    project_id = serializers.IntegerField()
    periods = serializers.ListField(child=serializers.CharField())
    brands = BrandSerializer(many=True)
    ui_texts = serializers.DictField(required=False)


class PlatformSalesDataSerializer(serializers.ModelSerializer):
    """平台销售数据序列化器"""
    class Meta:
        model = PlatformSalesData
        fields = [
            'id', 'platform', 'period_type', 'date', 'period_label',
            'sales_amount', 'order_count', 'visitor_count', 'paying_buyer_count',
            'conversion_rate', 'unit_price', 'cart_count', 'favorite_count',
            'uploaded_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'period_label', 'uploaded_by', 'created_at', 'updated_at']
