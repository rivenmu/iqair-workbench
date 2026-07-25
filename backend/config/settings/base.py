import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ============ Core Django ============
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError('SECRET_KEY environment variable is required')

DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

from utils.env_detect import detect_deploy_env
DEPLOY_ENV = detect_deploy_env()

INSTALLED_APPS = [
    'simpleui',
    'daphne',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_celery_beat',
    'django_celery_results',
    'drf_spectacular',
    'django_filters',
    'apps.accounts',
    'apps.projects',
    'apps.dashboard',
    'apps.snapshots',
    'apps.audit',
    'apps.navigation',
    'apps.system_env',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [BASE_DIR / 'templates'], 'APP_DIRS': True, 'OPTIONS': {'context_processors': ['django.template.context_processors.debug', 'django.template.context_processors.request', 'django.contrib.auth.context_processors.auth', 'django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'
DATABASES = {'default': {'ENGINE': 'django.db.backends.mysql', 'NAME': os.environ.get('DATABASE_NAME', 'iqair_workbench'), 'USER': os.environ.get('DATABASE_USER', 'iqair'), 'PASSWORD': os.environ.get('DATABASE_PASSWORD', ''), 'HOST': os.environ.get('DATABASE_HOST', 'mysql'), 'PORT': os.environ.get('DATABASE_PORT', '3306'), 'OPTIONS': {'charset': 'utf8mb4'}}}
REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', '')
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.redis.RedisCache', 'LOCATION': f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/1'}}
CHANNEL_LAYERS = {'default': {'BACKEND': 'channels_redis.core.RedisChannelLayer', 'CONFIG': {'hosts': [f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/2']}}}
CELERY_BROKER_URL = f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/0'
CELERY_RESULT_BACKEND = 'django-db'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Shanghai'
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
from config.beat_schedule import beat_schedule
CELERY_BEAT_SCHEDULE = beat_schedule
AUTH_USER_MODEL = 'accounts.User'
REST_FRAMEWORK = {'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',), 'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',), 'DEFAULT_FILTER_BACKENDS': ('django_filters.rest_framework.DjangoFilterBackend', 'rest_framework.filters.SearchFilter', 'rest_framework.filters.OrderingFilter'), 'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination', 'PAGE_SIZE': 50, 'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema'}
SIMPLE_JWT = {'ACCESS_TOKEN_LIFETIME': timedelta(hours=12), 'REFRESH_TOKEN_LIFETIME': timedelta(days=7), 'ROTATE_REFRESH_TOKENS': True, 'BLACKLIST_AFTER_ROTATION': True, 'AUTH_HEADER_TYPES': ('Bearer',)}
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
AUTH_PASSWORD_VALIDATORS = []
LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
SIMPLEUI_HOME_PAGE = None
SIMPLEUI_HOME_TITLE = 'RIVEN 管理后台'
SIMPLEUI_HOME_ICON = 'fa fa-dashboard'
SIMPLEUI_INDEX = None
SIMPLEUI_LOGO = None
SIMPLEUI_DEFAULT_THEME = 'admin.lte.css'
SIMPLEUI_STATIC_OFFLINE = True
SIMPLEUI_ADMIN_ORDER = ['navigation.WebsiteLink', 'accounts.User', 'projects.Project', 'snapshots.DataSnapshot', 'audit.OperationLog', 'django_celery_beat.PeriodicTask', 'django_celery_beat.IntervalSchedule', 'django_celery_beat.CrontabSchedule', 'django_celery_beat.SolarSchedule', 'django_celery_beat.ClockedSchedule']
SNAPSHOTS_DIR = os.environ.get('SNAPSHOTS_DIR', str(BASE_DIR.parent / 'data' / 'snapshots'))
SNAPSHOT_RETENTION_DAYS = 30
SNAPSHOT_RETENTION_COUNT = 100
LOG_RETENTION_DAYS = 90
LOG_FULL_KEEP_DAYS = 7
SYNC_ENABLED = DEPLOY_ENV == 'local' and os.environ.get('SYNC_ENABLED', 'true').lower() == 'true'
SYNC_SERVER_HOST = os.environ.get('SYNC_SERVER_HOST', '10.0.0.6')
SYNC_SERVER_USER = os.environ.get('SYNC_SERVER_USER', 'root')
SYNC_SERVER_PATH = os.environ.get('SYNC_SERVER_PATH', '/opt/iqair-workbench')
SPECTACULAR_SETTINGS = {'TITLE': 'IQAir Workbench API', 'DESCRIPTION': '数据仪表盘与分析平台', 'VERSION': '1.0.0', 'SERVE_INCLUDE_SCHEMA': False}
