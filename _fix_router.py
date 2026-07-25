p = r'C:\Users\Riven\Desktop\RivenCode\iqair-workbench\frontend\src\router\index.ts'
d = open(p, encoding='utf-8').read()
d = d.replace(
    "{ path: '/dashboard/iqair/:projectId?', redirect: '/dashboard/iqair-data' },",
    "{ path: '/dashboard/iqair', redirect: '/dashboard/iqair-competitor' },\n  { path: '/dashboard/iqair/:projectId?', redirect: '/dashboard/iqair-data' },"
)
open(p, 'w', encoding='utf-8').write(d)
print('router fixed')
