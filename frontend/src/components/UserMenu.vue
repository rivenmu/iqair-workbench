<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <div class="user-menu-trigger">
      <div class="user-avatar-dot">
        {{ userStore.username.charAt(0).toUpperCase() }}
      </div>
      <span class="user-name">{{ userStore.username }}</span>
      <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
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
</template>

<script setup lang="ts">
import { ArrowDown, User, UserFilled, Setting, SwitchButton } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

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
        type: 'warning',
      }).then(() => {
        userStore.logout()
        router.push('/')
      }).catch(() => {})
      break
  }
}
</script>

<style scoped lang="scss">
.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  transition: background var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}

.user-avatar-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.dropdown-icon {
  color: var(--color-text-secondary);
  font-size: 12px;
}
</style>
