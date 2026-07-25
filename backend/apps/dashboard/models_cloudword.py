from django.db import models

class CloudWord(models.Model):
    cn_text = models.CharField(max_length=50, verbose_name='中文关键词')
    en_text = models.CharField(max_length=50, blank=True, default='', verbose_name='英文关键词')
    weight = models.IntegerField(default=50, verbose_name='权重(1-100)')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'cloud_words'
        verbose_name = '词云关键词'
        verbose_name_plural = verbose_name
        ordering = ['-weight']

    def __str__(self):
        return self.cn_text
