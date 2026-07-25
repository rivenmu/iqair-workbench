from django.db import models


class IconType(models.TextChoices):
    IMAGE = 'image', '图片'
    EMOJI = 'emoji', 'Emoji'
    ICON_NAME = 'icon_name', '图标名称(Element Plus)'


class Project(models.Model):
    """项目（导航页展示的卡片 / 首页 Hero 色块）"""
    name = models.CharField(max_length=100, verbose_name='项目名称')
    description = models.TextField(blank=True, default='', verbose_name='描述')
    icon = models.CharField(max_length=50, default='Document', verbose_name='图标名称(Element Plus)')
    route = models.CharField(max_length=200, verbose_name='前端路由地址')
    thumbnail = models.ImageField(upload_to='project_thumbnails/', blank=True, null=True, verbose_name='缩略图')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    sort_order = models.IntegerField(default=0, verbose_name='排序权重')
    # 首页 Hero 色块展示
    is_featured = models.BooleanField(default=False, verbose_name='首页展示(色块)')
    gradient_color = models.CharField(max_length=100, blank=True, default='', verbose_name='渐变色 CSS 值')
    subtitle = models.CharField(max_length=200, blank=True, default='', verbose_name='副标题/简介')
    icon_type = models.CharField(max_length=20, choices=IconType.choices, default=IconType.ICON_NAME, verbose_name='图标类型')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'projects'
        verbose_name = '项目'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return self.name
