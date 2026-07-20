from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('dashboard', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PlatformSalesData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform', models.CharField(choices=[('tmall', '天猫'), ('jd', '京东')], max_length=10, verbose_name='平台')),
                ('period_type', models.CharField(choices=[('daily', '日'), ('weekly', '周'), ('monthly', '月')], max_length=10, verbose_name='周期类型')),
                ('date', models.DateField(verbose_name='数据日期')),
                ('period_label', models.CharField(blank=True, default='', max_length=30, verbose_name='期间标签 (如 2026-W28)')),
                ('sales_amount', models.DecimalField(decimal_places=2, default=0, max_digits=14, verbose_name='销售额 (元)')),
                ('order_count', models.IntegerField(default=0, verbose_name='订单数')),
                ('visitor_count', models.IntegerField(default=0, verbose_name='访客数')),
                ('paying_buyer_count', models.IntegerField(default=0, verbose_name='支付买家数')),
                ('conversion_rate', models.DecimalField(decimal_places=2, default=0, max_digits=6, verbose_name='支付转化率 (%)')),
                ('unit_price', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='客单价 (元)')),
                ('cart_count', models.IntegerField(default=0, verbose_name='加购人数')),
                ('favorite_count', models.IntegerField(default=0, verbose_name='收藏人数')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('uploaded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.user', verbose_name='上传者')),
            ],
            options={
                'verbose_name': '平台销售数据',
                'verbose_name_plural': '平台销售数据',
                'db_table': 'platform_sales_data',
                'ordering': ['-date'],
                'unique_together': {('platform', 'period_type', 'date')},
            },
        ),
    ]
