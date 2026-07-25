<template>
  <div class="workbench-layout">
    <AppNavBar brand-name="IQAir 工作台" :height="56">
      <template #left>
        <div class="brand-area" @click="$router.push('/dashboard')">
          <div class="logo">
            <el-icon size="24"><DataLine /></el-icon>
          </div>
          <span class="brand-name">IQAir 工作台</span>
        </div>
        <div class="brand-divider"></div>
      </template>
      <template #center>
        <nav class="tab-bar">
          <router-link
            v-for="tab in tabs"
            :key="tab.id"
            :to="tab.route"
            class="tab-item"
            :class="{ active: isActive(tab.route) }"
          >
            <el-icon size="16"><component :is="resolveIcon(tab.icon)" /></el-icon>
            <span class="tab-label">{{ tab.name }}</span>
          </router-link>
        </nav>
      </template>
      <template #right>
        <a href="/bi/" target="_blank" class="back-nav-link">
          <el-icon size="14"><TrendCharts /></el-icon>
          <span>BI 看板</span>
        </a>
        <router-link to="/" class="back-nav-link">
          <el-icon size="14"><HomeFilled /></el-icon>
          <span>回到网址导航</span>
        </router-link>
      </template>
    </AppNavBar>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { DataLine, HomeFilled, TrendCharts, Document as DocumentIcon } from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import AppNavBar from '@/components/AppNavBar.vue'
import { projectsApi, type ProjectItem } from '@/api/projects'

const route = useRoute()
const tabs = ref<ProjectItem[]>([])

function resolveIcon(iconName: string) {
  return (ElementPlusIconsVue as Record<string, any>)[iconName] || DocumentIcon
}

function isActive(path: string): boolean {
  return route.path === path
}

async function fetchProjects() {
  try {
    const data = await projectsApi.getProjects()
    tabs.value = (data as ProjectItem[])
      .filter(p => p.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  } catch { /* API fails silently, user can retry */ }
}

onMounted(() => { fetchProjects() })
</script>

<style scoped lang="scss">
.workbench-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
  overflow: hidden;
}
.brand-area {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
  &:hover { opacity: 0.7; }
}
.logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
}
.brand-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border-light);
  flex-shrink: 0;
}
.tab-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  overflow-x: auto;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  padding: 0 4px;
  &::-webkit-scrollbar { display: none; }
}
.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  &:hover { color: var(--color-text-primary); background: rgba(0,0,0,0.04); }
  &.active { color: var(--color-accent); background: var(--color-accent-light); font-weight: 600; }
}
.back-nav-link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
  &:hover { color: var(--color-accent); background: var(--color-accent-light); }
}
.page-fade-enter-active,
.page-fade-leave-active { transition: opacity 150ms var(--ease-out); }
.page-fade-enter-from,
.page-fade-leave-to { opacity: 0; }
</style>
