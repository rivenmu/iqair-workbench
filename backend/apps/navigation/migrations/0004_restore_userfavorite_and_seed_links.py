# Generated manually — restores user_favorites table and seeds more default links

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_more_links(apps, schema_editor):
    WebsiteLink = apps.get_model('navigation', 'WebsiteLink')

    links = [
        # 工作站点
        {
            'name': 'IQAir 数据看板',
            'url': '/dashboard/iqair',
            'description': 'IQAir 与竞品滤芯营收及占比演变分析',
            'icon_emoji': '📊',
            'category': 'work_sites',
            'is_internal': True,
            'sort_order': 1,
        },
        {
            'name': '数据仪表盘',
            'url': '/dashboard/iqair-data',
            'description': '综合数据仪表盘面板',
            'icon_emoji': '📈',
            'category': 'work_sites',
            'is_internal': True,
            'sort_order': 2,
        },
        {
            'name': '销售数据分析',
            'url': '/dashboard/sales',
            'description': '销售数据多维度分析',
            'icon_emoji': '💰',
            'category': 'work_sites',
            'is_internal': True,
            'sort_order': 3,
        },
        {
            'name': '周报面板',
            'url': '/dashboard/weekly',
            'description': '周报数据汇总面板',
            'icon_emoji': '📋',
            'category': 'work_sites',
            'is_internal': True,
            'sort_order': 4,
        },
        {
            'name': '空气质量实时监测',
            'url': '/dashboard/air-quality',
            'description': '空气质量数据实时监控',
            'icon_emoji': '🌍',
            'category': 'work_sites',
            'is_internal': True,
            'sort_order': 5,
        },
        # 实用工具
        {
            'name': '词云图',
            'url': '/ciyun',
            'description': '动态词云数据展示',
            'icon_emoji': '☁️',
            'category': 'tools',
            'is_internal': True,
            'sort_order': 10,
        },
        {
            'name': '飞书多维表格',
            'url': 'https://feishu.cn/base',
            'description': '飞书多维表格协作平台',
            'icon_emoji': '📘',
            'category': 'tools',
            'is_internal': False,
            'sort_order': 11,
        },
        {
            'name': 'ProcessOn',
            'url': 'https://processon.com',
            'description': '在线流程图、思维导图工具',
            'icon_emoji': '🔀',
            'category': 'tools',
            'is_internal': False,
            'sort_order': 12,
        },
        # AI 工具
        {
            'name': 'ChatGPT',
            'url': 'https://chat.openai.com',
            'description': 'OpenAI 对话助手',
            'icon_emoji': '🤖',
            'category': 'ai_tools',
            'is_internal': False,
            'sort_order': 20,
        },
        {
            'name': 'Claude',
            'url': 'https://claude.ai',
            'description': 'Anthropic AI 助手',
            'icon_emoji': '🧠',
            'category': 'ai_tools',
            'is_internal': False,
            'sort_order': 21,
        },
        {
            'name': '通义千问',
            'url': 'https://tongyi.aliyun.com',
            'description': '阿里云 AI 助手',
            'icon_emoji': '💡',
            'category': 'ai_tools',
            'is_internal': False,
            'sort_order': 22,
        },
    ]

    for link in links:
        WebsiteLink.objects.get_or_create(
            name=link['name'],
            defaults=link,
        )


def remove_seeded_links(apps, schema_editor):
    WebsiteLink = apps.get_model('navigation', 'WebsiteLink')
    WebsiteLink.objects.exclude(name='IQAir 数据看板').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('navigation', '0003_remove_userfavorite'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserFavorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='收藏时间')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to=settings.AUTH_USER_MODEL, verbose_name='用户')),
                ('website_link', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='navigation.websitelink', verbose_name='网站链接')),
            ],
            options={
                'verbose_name': '用户收藏',
                'verbose_name_plural': '用户收藏',
                'db_table': 'user_favorites',
                'ordering': ['-created_at'],
                'unique_together': {('user', 'website_link')},
            },
        ),
        migrations.RunPython(seed_more_links, remove_seeded_links),
    ]
