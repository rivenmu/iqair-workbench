p = r'C:\Users\Riven\Desktop\RivenCode\iqair-workbench\frontend\src\views\HomePage.vue'
d = open(p, encoding='utf-8').read()
# Add body overflow override in onMounted and cleanup on unmounted
old = 'onMounted(loadData)</script>'
new = '''onMounted(() => {
  document.body.style.overflow = 'auto'
  loadData()
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.body.style.overflow = ''
})</script>'''
d = d.replace(old, new)
open(p, 'w', encoding='utf-8').write(d)
print('FIX: body overflow override added to HomePage')
