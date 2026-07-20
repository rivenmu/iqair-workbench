"""
Celery Beat 定时任务配置
- 每天 2:00 清理旧快照
- 每天 3:00 清理旧操作日志
"""
from celery.schedules import crontab

beat_schedule = {
    'cleanup-old-snapshots': {
        'task': 'cleanup_old_snapshots',
        'schedule': crontab(hour=2, minute=0),
    },
    'cleanup-old-logs': {
        'task': 'cleanup_old_logs',
        'schedule': crontab(hour=3, minute=0),
    },
}
