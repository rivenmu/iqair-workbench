from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0002_platformsalesdata'),
    ]

    operations = [
        migrations.CreateModel(
            name='UIText',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=100, verbose_name='文本键 (如 mainTitle/thSales)')),
                ('value', models.TextField(blank=True, default='', verbose_name='文本内容')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ui_texts', to='projects.project', verbose_name='所属项目')),
            ],
            options={
                'verbose_name': '看板 UI 文本',
                'verbose_name_plural': '看板 UI 文本',
                'db_table': 'dashboard_ui_texts',
                'ordering': ['key'],
                'unique_together': {('project', 'key')},
            },
        ),
    ]
