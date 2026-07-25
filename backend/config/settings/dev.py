from .base import *

DEBUG = True

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8888',
    'https://localhost:8888',
    'http://10.0.0.6:8888',
    'http://10.0.0.6:8000',
    'http://iqair.rivenmu.cn:20001',
]

SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {'verbose': {'format': '[{asctime}] {levelname} {name} {message}', 'style': '{'}},
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'}},
    'root': {'handlers': ['console'], 'level': 'INFO'},
}

if DEPLOY_ENV == 'local':
    def _system_env_home(request):
        from apps.system_env.admin import system_env_panel_view
        return system_env_panel_view(request)
    if SIMPLEUI_HOME_PAGE is None:
        SIMPLEUI_HOME_PAGE = _system_env_home
