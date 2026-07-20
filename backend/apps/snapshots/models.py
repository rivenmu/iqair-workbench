import uuid
from django.db import models


class OperationType(models.TextChoices):
    CREATE = 'create', '新增'
    UPDATE = 'update', '修改'
    DELETE = 'delete', '删除'
    LOGIN = 'login', '登录'
    LOGOUT = 'logout', '登出'
    RESTORE = 'restore', '撤销恢复'


class DataSnapshot(models.Model):
    """
    数据快照
    混合存储策略：
    - 小数据 (<=1MB) 存入 small_data 字段 (JSON)
    - 大数据 (>1MB) 存入文件系统，file_path 记录路径
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='snapshots', verbose_name='项目')
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='snapshots', verbose_name='操作人')
    small_data = models.JSONField(null=True, blank=True, verbose_name='小数据 (JSON)')
    file_path = models.CharField(max_length=500, blank=True, default='', verbose_name='大数据文件路径')
    is_large = models.BooleanField(default=False, verbose_name='是否为大数据文件')
    operation_type = models.CharField(max_length=20, choices=OperationType.choices, default=OperationType.UPDATE, verbose_name='操作类型')
    note = models.TextField(blank=True, default='', verbose_name='备注说明')
    is_manual = models.BooleanField(default=False, verbose_name='是否手动创建')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'data_snapshots'
        verbose_name = '数据快照'
        verbose_name_plural = verbose_name
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.project.name} - {self.get_operation_type_display()} - {self.timestamp}'

    @property
    def size_bytes(self):
        """返回快照数据大小"""
        if self.is_large and self.file_path:
            import os
            try:
                return os.path.getsize(self.file_path)
            except OSError:
                return 0
        if self.small_data:
            import json
            return len(json.dumps(self.small_data, ensure_ascii=False).encode('utf-8'))
        return 0
