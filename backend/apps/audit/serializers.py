from rest_framework import serializers
from .models import OperationLog


class OperationLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    is_reversible = serializers.SerializerMethodField()

    class Meta:
        model = OperationLog
        fields = ['id', 'username', 'action', 'module', 'target_id',
                  'before_data', 'after_data', 'ip_address', 'timestamp', 'is_reversible']

    def get_is_reversible(self, obj):
        """判断是否可撤销（仅数据修改类操作可撤销）"""
        reversible_actions = ['create', 'update', 'delete', 'snapshot_create']
        return obj.action in reversible_actions
