"""Health-check endpoint returning structured JSON."""
from django.db import connections
from django.http import JsonResponse
import time

_START_TIME = time.time()


def health_check(request):
    status = {'status': 'ok', 'uptime_seconds': int(time.time() - _START_TIME)}

    try:
        connections['default'].cursor().execute('SELECT 1')
        status['database'] = 'ok'
    except Exception as e:
        status['database'] = f'error: {e}'
        status['status'] = 'degraded'

    try:
        from django_redis import get_redis_connection
        r = get_redis_connection('default')
        r.ping()
        status['redis'] = 'ok'
    except ImportError:
        status['redis'] = 'unavailable (django-redis not installed)'
    except Exception as e:
        status['redis'] = f'error: {e}'
        status['status'] = 'degraded'

    try:
        from celery import current_app
        insp = current_app.control.inspect()
        stats = insp.stats()
        active = len(stats) if stats else 0
        status['celery_workers'] = active
    except ImportError:
        status['celery_workers'] = 'unknown (celery not installed)'
    except Exception:
        status['celery_workers'] = 'unknown'

    return JsonResponse(status)
