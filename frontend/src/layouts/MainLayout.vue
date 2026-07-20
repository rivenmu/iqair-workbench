<template>
  <div class="main-layout">
    <!-- 毛玻璃导航栏 -->
    <header class="nav-bar">
      <div class="nav-content">
        <div class="nav-left" @click="router.push('/')">
          <div class="logo">
            <el-icon size="24" color="#007AFF"><DataLine /></el-icon>
          </div>
          <span class="brand-name">IQAir 工作台</span>
        </div>

        <div class="nav-right">
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
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DataLine, ArrowDown, User, UserFilled, SwitchButton, Setting } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

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
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

// 毛玻璃导航栏
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 60px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.nav-content {
  height: 100%;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
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
}

.nav-right {
  display: flex;
  align-items: center;
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

.main-content {
  flex: 1;
  overflow-y: auto;
}
</style>
