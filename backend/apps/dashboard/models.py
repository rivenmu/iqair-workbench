from django.db import models
from apps.projects.models import Project


class Platform(models.TextChoices):
    TMALL = 'tmall', '天猫'
    JD = 'jd', '京东'


class PeriodType(models.TextChoices):
    DAILY = 'daily', '日'
    WEEKLY = 'weekly', '周'
    MONTHLY = 'monthly', '月'


class Brand(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='brands', verbose_name='所属项目')
    name = models.CharField(max_length=100, verbose_name='品牌名称')
    color = models.CharField(max_length=20, default='#64748B', verbose_name='图表颜色')
    logo = models.TextField(blank=True, default='', verbose_name='Logo (base64 或 URL)')
    sort_order = models.IntegerField(default=0, verbose_name='排序权重')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'brands'
        verbose_name = '品牌'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', '-created_at']
        unique_together = ['project', 'name']

    def __str__(self):
        return self.name


class FilterRevenue(models.Model):
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='revenues', verbose_name='品牌')
    period = models.CharField(max_length=20, verbose_name='期间 (如 2024 H1)')
    revenue = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='销售额 (元)')
    filter_percentage = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='滤芯占比 (%)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'filter_revenues'
        verbose_name = '滤芯营收数据'
        verbose_name_plural = verbose_name
        ordering = ['period', '-revenue']
        unique_together = ['brand', 'period']
        indexes = [
            models.Index(fields=['brand', 'period'], name='filterrev_brand_period_idx'),
        ]

    def __str__(self):
        return f'{self.brand.name} - {self.period}'


class UIText(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='ui_texts', verbose_name='所属项目')
    key = models.CharField(max_length=100, verbose_name='文本键 (如 mainTitle/thSales)')
    value = models.TextField(blank=True, default='', verbose_name='文本内容')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'dashboard_ui_texts'
        verbose_name = '看板 UI 文本'
        verbose_name_plural = verbose_name
        unique_together = ['project', 'key']
        ordering = ['key']

    def __str__(self):
        return f'[{self.project.name}] {self.key}'


class PlatformSalesData(models.Model):
    platform = models.CharField(max_length=10, choices=Platform.choices, verbose_name='平台')
    period_type = models.CharField(max_length=10, choices=PeriodType.choices, verbose_name='周期类型')
    date = models.DateField(verbose_name='数据日期')
    period_label = models.CharField(max_length=30, blank=True, default='', verbose_name='期间标签 (如 2026-W28)')
    sales_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='销售额 (元)')
    order_count = models.IntegerField(default=0, verbose_name='订单数')
    visitor_count = models.IntegerField(default=0, verbose_name='访客数')
    paying_buyer_count = models.IntegerField(default=0, verbose_name='支付买家数')
    conversion_rate = models.DecimalField(max_digits=6, decimal_places=2, default=0, verbose_name='支付转化率 (%)')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='客单价 (元)')
    cart_count = models.IntegerField(default=0, verbose_name='加购人数')
    favorite_count = models.IntegerField(default=0, verbose_name='收藏人数')
    uploaded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='上传者')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'platform_sales_data'
        verbose_name = '平台销售数据'
        verbose_name_plural = verbose_name
        ordering = ['-date']
        unique_together = ['platform', 'period_type', 'date']
        indexes = [
            models.Index(fields=['platform', 'period_type', 'date'], name='psd_pltfm_period_date_idx'),
        ]

    @property
    def computed_period_label(self):
        if self.period_type == 'daily':
            return self.date.strftime('%Y-%m-%d')
        elif self.period_type == 'weekly':
            iso = self.date.isocalendar()
            return f'{iso[0]}-W{iso[1]:02d}'
        else:
            return self.date.strftime('%Y-%m')

    def __str__(self):
        return f'{self.get_platform_display()} {self.date}'
