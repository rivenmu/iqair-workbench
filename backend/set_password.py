import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from apps.accounts.models import User
u = User.objects.get(username='admin')
u.set_password('admin123')
u.save()
print('Password set successfully')
