from django.db import migrations


def seed_default_links(apps, schema_editor):
    WebsiteLink = apps.get_model('navigation', 'WebsiteLink')
    WebsiteLink.objects.get_or_create(
        name='IQAir 数据看板',
        defaults={
            'url': '/dashboard/iqair',
            'description': 'IQAir 与竞品滤芯营收及占比演变分析',
            'icon_emoji': '📊',
            'category': 'work_sites',
            'is_internal': True,
            'sort_order': 1,
            'is_active': True,
        }
    )


def remove_default_links(apps, schema_editor):
    WebsiteLink = apps.get_model('navigation', 'WebsiteLink')
    WebsiteLink.objects.filter(name='IQAir 数据看板').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('navigation', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(seed_default_links, remove_default_links),
    ]
