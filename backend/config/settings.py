import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-development-key-change-in-production')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

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
    # 绗笁鏂?
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_celery_beat',
    'django_celery_results',
    'drf_spectacular',
    'django_filters',
    # 鏈湴搴旂敤
    'apps.accounts',
    'apps.projects',
    'apps.dashboard',
    'apps.snapshots',
    'apps.audit',
    'apps.navigation',
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

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ============ 鏁版嵁搴撻厤缃?============
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DATABASE_NAME', 'iqair_workbench'),
        'USER': os.environ.get('DATABASE_USER', 'iqair'),
        'PASSWORD': os.environ.get('DATABASE_PASSWORD', 'iqairpassword123'),
        'HOST': os.environ.get('DATABASE_HOST', 'mysql'),
        'PORT': os.environ.get('DATABASE_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    }
}

# ============ Redis & Cache ============
REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', 'redispassword123')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/1',
    }
}

# Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/2'],
        },
    }
}

# ============ Celery 閰嶇疆 ============
CELERY_BROKER_URL = f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/0'
CELERY_RESULT_BACKEND = 'django-db'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Shanghai'
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

from config.beat_schedule import beat_schedule
CELERY_BEAT_SCHEDULE = beat_schedule

# ============ Auth & JWT ============
AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ============ CORS ============
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ============ CSRF锛圓dmin浠ｇ悊璁块棶锛?============
CSRF_TRUSTED_ORIGINS = [
    'http://10.0.0.6:8888',
    'http://10.0.0.6:8000',
    'http://iqair.rivenmu.cn:20001',
    'https://iqair.rivenmu.cn:20001',
    'http://localhost:8888',
    'https://localhost:8888',
]
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# ============ 瀵嗙爜楠岃瘉 ============
# 宸插彇娑堟墍鏈夊瘑鐮佸鏉傚害闄愬埗锛堥暱搴︺€佸父瑙佸害銆佺浉浼煎害銆佺函鏁板瓧妫€鏌ワ級锛?
# 鐢ㄦ埛鍙缃换鎰忛暱搴﹀拰澶嶆潅搴︾殑瀵嗙爜銆?
AUTH_PASSWORD_VALIDATORS = []

# ============ 鍥介檯鍖?============
LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True

# ============ 闈欐€佹枃浠?============
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============ SimpleUI 閰嶇疆 ============
SIMPLEUI_HOME_PAGE = None
SIMPLEUI_HOME_TITLE = 'RIVEN 绠＄悊鍚庡彴'
SIMPLEUI_HOME_ICON = 'fa fa-dashboard'
SIMPLEUI_INDEX = None
SIMPLEUI_LOGO = None
SIMPLEUI_DEFAULT_THEME = 'admin.lte.css'

# 闅愯棌涓嶉渶瑕佺殑鍐呯疆妯″瀷
SIMPLEUI_STATIC_OFFLINE = True

# SimpleUI 鑿滃崟鎺掑簭涓庣簿绠€
SIMPLEUI_ADMIN_ORDER = [
    'navigation.WebsiteLink',
    'accounts.User',
    'projects.Project',
    'snapshots.DataSnapshot',
    'audit.OperationLog',
    'django_celery_beat.PeriodicTask',
    'django_celery_beat.IntervalSchedule',
    'django_celery_beat.CrontabSchedule',
    'django_celery_beat.SolarSchedule',
    'django_celery_beat.ClockedSchedule',
]

# ============ 椤圭洰鑷畾涔夐厤缃?============
SNAPSHOTS_DIR = os.environ.get('SNAPSHOTS_DIR', str(BASE_DIR.parent / 'data' / 'snapshots'))
SNAPSHOT_RETENTION_DAYS = 30
SNAPSHOT_RETENTION_COUNT = 100
LOG_RETENTION_DAYS = 90
LOG_FULL_KEEP_DAYS = 7

# 鏃ュ織
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'},
        'file': {
            'class': 'logging.FileHandler',
            'filename': str(BASE_DIR / 'logs' / 'django.log'),
            'formatter': 'verbose',
        },
    },
    'root': {'handlers': ['console', 'file'], 'level': 'INFO'},
}
