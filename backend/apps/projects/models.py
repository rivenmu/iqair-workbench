from django.db import models


class Project(models.Model):
    """项目（导航页展示的卡片）"""
    name = models.CharField(max_length=100, verbose_name='项目名称')
    description = models.TextField(blank=True, default='', verbose_name='描述')
    icon = models.CharField(max_length=50, default='Document', verbose_name='图标名称(Element Plus)')
    route = models.CharField(max_length=200, verbose_name='前端路由地址')
    thumbnail = models.ImageField(upload_to='project_thumbnails/', blank=True, null=True, verbose_name='缩略图')
    is_featured = models.BooleanField(default=False, verbose_name='在首页色块区展示')
    gradient_color = models.CharField(
        max_length=200, blank=True, default='',
        verbose_name='渐变色',
        help_text='CSS linear-gradient 值，例如: linear-gradient(135deg, #4F46E5, #7C3AED)'
    )
    subtitle = models.CharField(max_length=200, blank=True, default='', verbose_name='色块副标题')
    icon_type = models.CharField(
        max_length=20, default='icon',
        choices=[('image', '图片'), ('emoji', 'Emoji'), ('icon', '图标')],
        verbose_name='图标类型'
    )
    icon_emoji = models.CharField(max_length=20, blank=True, default='', verbose_name='Emoji图标')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    sort_order = models.IntegerField(default=0, verbose_name='排序权重')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'projects'
        verbose_name = '项目'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return self.name
