import subprocess
import logging
from datetime import datetime, timezone

from django.conf import settings

from .models import SyncRecord

logger = logging.getLogger(__name__)


def trigger_sync(trigger='manual'):
    """Execute sync via docker exec on the db-sync container.

    Creates a SyncRecord, runs the sync-db.sh script inside the container,
    and updates the record with the result.

    Returns the SyncRecord instance.
    """
    sync_record = SyncRecord.objects.create(
        trigger=trigger,
        status='running',
        started_at=datetime.now(timezone.utc),
    )

    try:
        result = subprocess.run(
            ['docker', 'exec', 'iqair-db-sync', '/sync/sync-db.sh'],
            capture_output=True,
            text=True,
            timeout=600,  # 10 minute timeout
        )

        finished_at = datetime.now(timezone.utc)
        duration = (finished_at - sync_record.started_at).total_seconds()

        if result.returncode == 0:
            sync_record.status = 'success'
            sync_record.error_message = ''
        else:
            sync_record.status = 'failed'
            sync_record.error_message = result.stderr or result.stdout or 'Unknown error'

        sync_record.finished_at = finished_at
        sync_record.duration_seconds = duration
        sync_record.save(update_fields=['status', 'finished_at', 'duration_seconds', 'error_message'])

        logger.info('Sync %s completed: %s (%.1fs)', sync_record.id, sync_record.status, duration)

    except subprocess.TimeoutExpired:
        sync_record.status = 'failed'
        sync_record.finished_at = datetime.now(timezone.utc)
        sync_record.duration_seconds = (sync_record.finished_at - sync_record.started_at).total_seconds()
        sync_record.error_message = 'Sync timed out after 10 minutes'
        sync_record.save(update_fields=['status', 'finished_at', 'duration_seconds', 'error_message'])
        logger.error('Sync %s timed out', sync_record.id)

    except Exception as e:
        sync_record.status = 'failed'
        sync_record.finished_at = datetime.now(timezone.utc)
        sync_record.duration_seconds = (sync_record.finished_at - sync_record.started_at).total_seconds()
        sync_record.error_message = str(e)
        sync_record.save(update_fields=['status', 'finished_at', 'duration_seconds', 'error_message'])
        logger.exception('Sync %s failed with exception', sync_record.id)

    return sync_record


def get_latest_sync():
    """Return the most recent SyncRecord or None."""
    return SyncRecord.objects.first()
