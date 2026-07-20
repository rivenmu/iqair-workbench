from django.db import models


class OperationLog(models.Model):
    """
    操作审计日志
    保留策略：
    - 7天内：完整保留
    - 7-90天：每天只保留最后一条记录
    - 超过90天：自动删除
    """
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='operation_logs', verbose_name='操作人')
    action = models.CharField(max_length=50, verbose_name='操作类型')
    module = models.CharField(max_length=50, verbose_name='操作模块')
    target_id = models.CharField(max_length=100, blank=True, default='', verbose_name='操作目标ID')
    before_data = models.JSONField(null=True, blank=True, verbose_name='修改前数据')
    after_data = models.JSONField(null=True, blank=True, verbose_name='修改后数据')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP地址')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        db_table = 'operation_logs'
        verbose_name = '操作日志'
        verbose_name_plural = verbose_name
        ordering = ['-timestamp']

    def __str__(self):
        username = self.user.username if self.user else 'unknown'
        return f'{username} - {self.action} - {self.timestamp}'
