# Generated manually to match existing database state
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0002_remove_project_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='gradient_color',
            field=models.CharField(blank=True, default='', max_length=100, verbose_name='渐变色'),
        ),
        migrations.AddField(
            model_name='project',
            name='icon_type',
            field=models.CharField(choices=[('image', '图片'), ('emoji', 'Emoji'), ('icon', '图标')], default='icon', max_length=20, verbose_name='图标类型'),
        ),
        migrations.AddField(
            model_name='project',
            name='is_featured',
            field=models.BooleanField(default=False, verbose_name='在首页色块区展示'),
        ),
        migrations.AddField(
            model_name='project',
            name='subtitle',
            field=models.CharField(blank=True, default='', max_length=200, verbose_name='色块副标题'),
        ),
        migrations.AlterModelTable(
            name='project',
            table='projects',
        ),
    ]
