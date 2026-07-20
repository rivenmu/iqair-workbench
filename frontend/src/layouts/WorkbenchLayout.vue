<template>
  <div class="workbench-layout">
    <!-- 顶部导航栏（含品牌区 + Tab 栏 + 用户区） -->
    <header class="nav-bar">
      <div class="nav-content">
        <!-- 左侧：品牌 + Tab 栏 -->
        <div class="nav-left">
          <div class="brand-area" @click="router.push('/dashboard')">
            <div class="logo">
              <el-icon size="24" color="#007AFF"><DataLine /></el-icon>
            </div>
            <span class="brand-name">IQAir 工作台</span>
          </div>

          <div class="brand-divider"></div>

          <!-- 项目切换 Tab 栏 -->
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
        </div>

        <!-- 右侧：BI看板 + 回到网址导航 + 用户区 -->
        <div class="nav-right">
          <a href="/bi/" target="_blank" class="back-nav-link">
            <el-icon size="14"><TrendCharts /></el-icon>
            <span>BI 看板</span>
          </a>

          <router-link to="/" class="back-nav-link">
            <el-icon size="14"><HomeFilled /></el-icon>
            <span>回到网址导航</span>
          </router-link>

          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-avatar">
              <el-avatar :size="32" class="avatar-circle">
                {{ userStore.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userStore.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人设置
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="users">
                  <el-icon><UserFilled /></el-icon> 用户管理
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin">
                  <el-icon><Setting /></el-icon> 管理后台
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  DataLine, ArrowDown, User, UserFilled, SwitchButton, Setting,
  HomeFilled, TrendCharts, Document as DocumentIcon
} from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { projectsApi, type ProjectItem } from '@/api/projects'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

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
  } catch {
    // API 请求失败时使用空列表，用户可刷新重试
  }
}

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'users':
      router.push('/users')
      break
    case 'admin':
      window.open(`/api/auth/admin-sso/?token=${userStore.token}`, '_blank')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '退出',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        userStore.logout()
        router.push('/login')
      }).catch(() => {})
      break
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped lang="scss">
.workbench-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

// 顶部导航栏
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.nav-content {
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
  }
}

.logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(90, 200, 250, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
  white-space: nowrap;
}

.brand-divider {
  width: 1px;
  height: 24px;
  background: rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

// Tab 栏（与品牌区水平对齐）
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

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #86868B;
  text-decoration: none;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: #1C1C1E;
    background: rgba(0, 0, 0, 0.04);
  }

  &.active {
    color: #007AFF;
    background: rgba(0, 122, 255, 0.1);
    font-weight: 600;
  }

  .tab-label {
    line-height: 1;
  }
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.back-nav-link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #86868B;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: #007AFF;
    background: rgba(0, 122, 255, 0.08);
  }
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}

.avatar-circle {
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  color: white;
  font-weight: 600;
}

.username {
  font-size: 14px;
  color: #1C1C1E;
  font-weight: 500;
}

// 主内容区
.main-content {
  flex: 1;
  overflow: hidden;
}

// 路由切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
