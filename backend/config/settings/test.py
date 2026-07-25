from .dev import *

DATABASES['default'] = {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}
AUTH_PASSWORD_VALIDATORS = []
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# Run Celery tasks synchronously in tests (no Redis needed)
CELERY_BROKER_URL = 'memory://'
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Use in-memory cache instead of Redis
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}}

# Skip Channels for tests
CHANNEL_LAYERS = {'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}}
