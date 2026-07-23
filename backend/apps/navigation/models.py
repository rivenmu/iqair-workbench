from django.db import models


class LinkCategory(models.TextChoices):
    """导航链接分类"""
    WORK_SITES = 'work_sites', '工作站点'
    PERSONAL_SITES = 'personal_sites', '个人站点'
    TOOLS = 'tools', '实用工具'
    AI_TOOLS = 'ai_tools', 'AI工具'


class WebsiteLink(models.Model):
    """网站链接"""
    name = models.CharField(max_length=100, verbose_name='网站名称')
    url = models.CharField(max_length=500, verbose_name='链接地址')
    description = models.TextField(blank=True, default='', verbose_name='描述')
    icon_image = models.ImageField(
        upload_to='link_icons/', blank=True, null=True, verbose_name='图标图片'
    )
    icon_emoji = models.CharField(
        max_length=20, blank=True, default='', verbose_name='图标Emoji(备选)'
    )
    category = models.CharField(
        max_length=20,
        choices=LinkCategory.choices,
        default=LinkCategory.WORK_SITES,
        verbose_name='分类'
    )
    is_internal = models.BooleanField(
        default=False, verbose_name='是否内部链接(使用路由跳转)'
    )
    sort_order = models.IntegerField(default=0, verbose_name='排序权重')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'website_links'
        verbose_name = '网站链接'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return self.name
