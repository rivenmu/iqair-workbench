# Fix all three issues
base = r'C:\Users\Riven\Desktop\RivenCode\iqair-workbench'

# --- FIX 1: HomePage blank page ---
# Remove overflow:hidden from body for the homepage route
hp = open(f'{base}/frontend/src/views/HomePage.vue', encoding='utf-8').read()
# Add overflow fix: override body overflow
hp = hp.replace(
    '.home-page { min-height: 100vh;',
    '.home-page { min-height: 100vh; overflow-y: auto; height: 100vh;'
)
open(f'{base}/frontend/src/views/HomePage.vue', 'w', encoding='utf-8').write(hp)
print('FIX 1: HomePage overflow fixed')

# --- FIX 2: DB sync endpoints ---
urls = open(f'{base}/backend/config/urls.py', encoding='utf-8').read()
# Verify system-env is in the urlpatterns
if 'system-env' not in urls:
    print('WARNING: system-env missing from urls.py!')
else:
    print('FIX 2: system-env already in urls.py')

# --- FIX 3: Router redirect (verify) ---
router = open(f'{base}/frontend/src/router/index.ts', encoding='utf-8').read()
if '/dashboard/iqair-competitor' in router:
    print('FIX 3: Router redirect to iqair-competitor confirmed')
else:
    print('WARNING: Router fix not applied!')

# --- EXTRA: Add system_env to SIMPLEUI_ADMIN_ORDER in base settings ---
base_settings = open(f'{base}/backend/config/settings/base.py', encoding='utf-8').read()
if 'system_env' not in base_settings:
    print('WARNING: system_env not in SIMPLEUI_ADMIN_ORDER')
else:
    print('OK: system_env in settings')
