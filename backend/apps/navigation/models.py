from django.conf import settings
from django.db import models


class LinkCategory(models.TextChoices):
    WORK_SITES = 'work_sites', '工作站点'
    PERSONAL_SITES = 'personal_sites', '个人站点'
    TOOLS = 'tools', '实用工具'
    AI_TOOLS = 'ai_tools', 'AI工具'
    COMMON_SITES = 'common_sites', '常用网址'
    FRIEND_LINKS = 'friend_links', '友情链接'
    AI_RESOURCES = 'ai_resources', 'AI工具资料'


class WebsiteLink(models.Model):
    name = models.CharField(max_length=100, verbose_name='网站名称')
    url = models.CharField(max_length=500, verbose_name='链接地址')
    description = models.TextField(blank=True, default='', verbose_name='描述')
    icon_image = models.ImageField(upload_to='link_icons/', blank=True, null=True, verbose_name='图标图片')
    icon_emoji = models.CharField(max_length=20, blank=True, default='', verbose_name='图标Emoji(备选)')
    category = models.CharField(max_length=20, choices=LinkCategory.choices, default=LinkCategory.WORK_SITES, verbose_name='分类')
    is_internal = models.BooleanField(default=False, verbose_name='是否内部链接(使用路由跳转)')
    sort_order = models.IntegerField(default=0, verbose_name='排序权重')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    icon_fetch_failed = models.BooleanField(default=False, verbose_name='图标抓取失败')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'website_links'
        verbose_name = '网站链接'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', '-created_at']
        indexes = [
            models.Index(fields=['category', 'sort_order'], name='wlink_cat_sort_idx'),
        ]

    def __str__(self):
        return self.name


class UserFavorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites', verbose_name='用户')
    website_link = models.ForeignKey(WebsiteLink, on_delete=models.CASCADE, related_name='favorited_by', verbose_name='网站链接')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='收藏时间')

    class Meta:
        db_table = 'user_favorites'
        verbose_name = '用户收藏'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        unique_together = [('user', 'website_link')]

    def __str__(self):
        return f'{self.user} - {self.website_link}'
