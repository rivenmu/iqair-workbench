<template>
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
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowDown, User, UserFilled, Setting, SwitchButton } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
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
.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--transition-fast);
  &:hover { background: rgba(0, 0, 0, 0.04); }
}
.avatar-circle {
  background: linear-gradient(135deg, var(--color-accent), var(--color-info));
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}
.username {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}
</style>
