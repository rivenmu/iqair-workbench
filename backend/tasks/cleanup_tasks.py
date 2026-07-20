"""
Celery 定时任务 - 数据清理
包括：快照清理、操作日志清理
"""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name='cleanup_old_snapshots')
def cleanup_old_snapshots():
    """清理旧快照 - 每天2:00执行"""
    logger.info('开始清理旧快照...')
    try:
        from apps.snapshots.services import SnapshotService
        SnapshotService.cleanup_old_snapshots()
        logger.info('旧快照清理完成')
    except Exception as e:
        logger.error(f'清理旧快照失败: {e}')


@shared_task(name='cleanup_old_logs')
def cleanup_old_logs():
    """清理旧操作日志 - 每天3:00执行"""
    logger.info('开始清理旧操作日志...')
    try:
        from apps.audit.services import AuditLogService
        AuditLogService.cleanup_old_logs()
        logger.info('旧操作日志清理完成')
    except Exception as e:
        logger.error(f'清理旧操作日志失败: {e}')
