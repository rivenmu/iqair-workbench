from django.db import models


class SyncRecord(models.Model):
    """Records each sync operation from server to local database."""

    TRIGGER_CHOICES = [
        ('manual', 'Manual'),
        ('cron', 'Cron (Auto)'),
    ]

    STATUS_CHOICES = [
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    trigger = models.CharField(
        max_length=16, choices=TRIGGER_CHOICES, default='manual',
        verbose_name='Trigger'
    )
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default='running',
        verbose_name='Status'
    )
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Started At')
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name='Finished At')
    duration_seconds = models.FloatField(null=True, blank=True, verbose_name='Duration (s)')
    error_message = models.TextField(blank=True, default='', verbose_name='Error Message')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')

    class Meta:
        db_table = 'sync_records'
        verbose_name = 'Sync Record'
        verbose_name_plural = 'Sync Records'
        ordering = ['-started_at']

    def __str__(self):
        return f"Sync #{self.id} [{self.status}] {self.started_at.strftime('%Y-%m-%d %H:%M')}"
