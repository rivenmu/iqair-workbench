from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.views import View

from utils.env_detect import detect_deploy_env, get_env_info
from .services import trigger_sync, trigger_push, get_latest_sync


@csrf_exempt
@require_POST
def trigger_sync_view(request):
    """AJAX endpoint to trigger a manual sync. Only available in local env."""
    if detect_deploy_env() != 'local':
        return JsonResponse({'success': False, 'error': 'Sync is only available in local environment'}, status=403)

    record = trigger_sync(trigger='manual')

    return JsonResponse({
        'success': record.status == 'success',
        'status': record.status,
        'started_at': record.started_at.isoformat() if record.started_at else None,
        'finished_at': record.finished_at.isoformat() if record.finished_at else None,
        'duration_seconds': record.duration_seconds,
        'error_message': record.error_message,
    })


@csrf_exempt
@require_POST
def trigger_push_view(request):
    """AJAX endpoint to trigger a push to server. Only available in local env."""
    if detect_deploy_env() != 'local':
        return JsonResponse({'success': False, 'error': 'Push is only available in local environment'}, status=403)

    record = trigger_push(trigger='manual')

    return JsonResponse({
        'success': record.status == 'success',
        'status': record.status,
        'started_at': record.started_at.isoformat() if record.started_at else None,
        'finished_at': record.finished_at.isoformat() if record.finished_at else None,
        'duration_seconds': record.duration_seconds,
        'error_message': record.error_message,
    })


def sync_status_view(request):
    """Return current env info and latest sync status as JSON."""
    env_info = get_env_info()
    latest = get_latest_sync()

    sync_info = None
    if latest:
        sync_info = {
            'id': latest.id,
            'status': latest.status,
            'trigger': latest.trigger,
            'started_at': latest.started_at.isoformat() if latest.started_at else None,
            'finished_at': latest.finished_at.isoformat() if latest.finished_at else None,
            'duration_seconds': latest.duration_seconds,
            'error_message': latest.error_message,
        }

    return JsonResponse({
        'environment': env_info,
        'latest_sync': sync_info,
    })
