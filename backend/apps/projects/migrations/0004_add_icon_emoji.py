from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0003_refactor_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='icon_emoji',
            field=models.CharField(blank=True, default='', max_length=20, verbose_name='Emoji图标'),
        ),
    ]
