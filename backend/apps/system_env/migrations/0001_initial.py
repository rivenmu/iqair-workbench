# Generated migration for SyncRecord model

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SyncRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('trigger', models.CharField(choices=[('manual', 'Manual'), ('cron', 'Cron (Auto)')], default='manual', max_length=16, verbose_name='Trigger')),
                ('status', models.CharField(choices=[('running', 'Running'), ('success', 'Success'), ('failed', 'Failed')], default='running', max_length=16, verbose_name='Status')),
                ('started_at', models.DateTimeField(auto_now_add=True, verbose_name='Started At')),
                ('finished_at', models.DateTimeField(blank=True, null=True, verbose_name='Finished At')),
                ('duration_seconds', models.FloatField(blank=True, null=True, verbose_name='Duration (s)')),
                ('error_message', models.TextField(blank=True, default='', verbose_name='Error Message')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
            ],
            options={
                'verbose_name': 'Sync Record',
                'verbose_name_plural': 'Sync Records',
                'db_table': 'sync_records',
                'ordering': ['-started_at'],
            },
        ),
    ]
