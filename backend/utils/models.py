"""Common base models for all apps."""
from django.db import models


class TimestampModel(models.Model):
    """Abstract model with auto-managed created_at / updated_at fields."""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='created_at')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='updated_at')

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """Abstract model with soft-delete support.

    Usage: inherit alongside your concrete model, then use
    .objects.filter(is_deleted=False) (or a custom manager) for
    active-only queries.
    """
    is_deleted = models.BooleanField(default=False, verbose_name='is_deleted')
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='deleted_at')

    class Meta:
        abstract = True


class AuditableModel(TimestampModel):
    """Abstract model with pre-configured audit hooks.

    Fields created_by / updated_by track the user responsible for
    the last write.  The AuditLogMixin on the ViewSet layer pushes
    before/after snapshots into the operation_logs table.
    """
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
        verbose_name='created_by',
    )
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
        verbose_name='updated_by',
    )

    class Meta:
        abstract = True
