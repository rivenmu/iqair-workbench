import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { title: 'RIVEN', requiresAuth: false }
  },
  { path: '/navigation', redirect: '/' },
  { path: '/projects', redirect: '/' },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/ciyun',
    name: 'CiYun',
    component: () => import('@/views/dashboard/CiYunPanel.vue'),
    meta: { title: '词云图', requiresAuth: false }
  },
  { path: '/dashboard/iqair', redirect: '/dashboard/iqair-competitor' },
  { path: '/dashboard/iqair/:projectId?', redirect: '/dashboard/iqair-data' },
  { path: '/dashboard/iqair-main', redirect: '/dashboard/iqair-data' },
  {
    path: '/dashboard',
    component: () => import('@/layouts/WorkbenchLayout.vue'),
    redirect: '/dashboard/iqair-data',
    meta: { requiresAuth: true },
    children: [
      { path: 'iqair-data', name: 'IQAirData', component: () => import('@/views/dashboard/IQAirDataPanel.vue'), meta: { title: '数据仪表盘', requiresAuth: true } },
      { path: 'iqair-competitor', name: 'IQAirCompetitor', component: () => import('@/views/dashboard/IQAirCompetitor.vue'), meta: { title: 'IQAir及竞品数据面板', requiresAuth: true } },
      { path: 'air-quality', name: 'AirQuality', component: () => import('@/views/dashboard/AirQualityPanel.vue'), meta: { title: '空气质量实时监测', requiresAuth: true } },
      { path: 'sales', name: 'Sales', component: () => import('@/views/dashboard/SalesPanel.vue'), meta: { title: '销售数据分析', requiresAuth: true } },
      { path: 'weekly', name: 'Weekly', component: () => import('@/views/dashboard/WeeklyPanel.vue'), meta: { title: '周报面板', requiresAuth: true } },
      { path: 'daily', name: 'Daily', component: () => import('@/views/dashboard/DailyPanel.vue'), meta: { title: '日报面板', requiresAuth: true } },
      { path: ':pathMatch(.*)*', name: 'GenericPanel', component: () => import('@/views/dashboard/GenericPanel.vue'), meta: { title: '面板', requiresAuth: true } },
    ]
  },
  { path: '/users', name: 'UserManagement', component: () => import('@/views/UserManagement.vue'), meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true } },
  { path: '/profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人设置', requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - RIVEN` : 'RIVEN'
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) { next({ name: 'Login', query: { redirect: to.fullPath } }); return }
  if (to.meta.requiresAdmin && !userStore.isAdmin) { next({ name: 'Home' }); return }
  if ((to.name === 'Login' || to.name === 'Register') && userStore.isLoggedIn) { next({ name: 'Home' }); return }
  next()
})

export default router
