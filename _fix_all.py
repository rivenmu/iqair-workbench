# Fix all three issues
import os

# --- 1. Router fix (already done, but let's verify) ---
# --- 2. DB sync: check system_env urls ---
base = r'C:\Users\Riven\Desktop\RivenCode\iqair-workbench'

# Read system_env/urls.py
urls_path = os.path.join(base, 'backend', 'apps', 'system_env', 'urls.py')
if os.path.exists(urls_path):
    with open(urls_path, encoding='utf-8') as f:
        content = f.read()
    print('system_env urls.py exists:', len(content), 'chars')

# Read projects.ts
proj_path = os.path.join(base, 'frontend', 'src', 'api', 'projects.ts')
with open(proj_path, encoding='utf-8') as f:
    print(f.read()[:300])

# --- 3. Check HomePage for critical issues ---
hp_path = os.path.join(base, 'frontend', 'src', 'views', 'HomePage.vue')
with open(hp_path, encoding='utf-8') as f:
    hp = f.read()
print('HomePage has template:', '<template>' in hp)
print('HomePage has onMounted(loadData):', 'onMounted(loadData)' in hp)
print('HomePage has .home-page class:', '.home-page' in hp)
