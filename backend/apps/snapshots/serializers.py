from rest_framework import serializers
from .models import DataSnapshot, OperationType


class DataSnapshotSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    operation_type_display = serializers.CharField(source='get_operation_type_display', read_only=True)
    size_display = serializers.SerializerMethodField()

    class Meta:
        model = DataSnapshot
        fields = ['id', 'project', 'username', 'operation_type', 'operation_type_display',
                  'note', 'is_manual', 'timestamp', 'size_display', 'is_large']

    def get_size_display(self, obj):
        """返回人类可读的大小"""
        size = obj.size_bytes
        if size == 0:
            return '0 B'
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f'{size:.1f} {unit}'
            size /= 1024
        return f'{size:.1f} TB'


class CreateSnapshotSerializer(serializers.Serializer):
    """手动创建快照"""
    note = serializers.CharField(max_length=500, required=False, default='')
