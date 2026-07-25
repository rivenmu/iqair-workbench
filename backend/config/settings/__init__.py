import os

_ENV = os.environ.get('DJANGO_ENV', 'dev').strip().lower()

if _ENV == 'production':
    from .prod import *  # noqa: F401, F403
else:
    from .dev import *  # noqa: F401, F403
