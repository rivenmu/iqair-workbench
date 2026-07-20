<template>
  <MainLayout>
    <div class="profile-page">
      <div class="page-header">
        <h1 class="page-title">个人设置</h1>
      </div>

      <div class="profile-content">
        <!-- 个人信息卡片 -->
        <el-card class="info-card">
          <template #header>
            <span class="card-title">个人信息</span>
          </template>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">用户名</span>
              <span class="info-value">{{ userStore.userInfo?.username }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">角色</span>
              <el-tag :type="userStore.isAdmin ? 'danger' : 'info'">
                {{ userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </div>
            <div class="info-row">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ userStore.userInfo?.email || '未设置' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">手机号</span>
              <span class="info-value">{{ userStore.userInfo?.phone || '未设置' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">注册时间</span>
              <span class="info-value">{{ formatDate(userStore.userInfo?.created_at) }}</span>
            </div>
          </div>
        </el-card>

        <!-- 修改密码卡片 -->
        <el-card class="password-card">
          <template #header>
            <span class="card-title">修改密码</span>
          </template>
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
            <el-form-item label="原密码" prop="old_password">
              <el-input
                v-model="passwordForm.old_password"
                type="password"
                placeholder="请输入原密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="new_password">
              <el-input
                v-model="passwordForm.new_password"
                type="password"
                placeholder="至少8位，包含字母和数字"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirm_password">
              <el-input
                v-model="passwordForm.confirm_password"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="changing">
                确认修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import MainLayout from '@/layouts/MainLayout.vue'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const userStore = useUserStore()
const changing = ref(false)
const passwordFormRef = ref<FormInstance>()

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const passwordValidator = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else {
    callback()
  }
}

const confirmPasswordValidator = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [{ required: true, validator: passwordValidator, trigger: 'blur' }],
  confirm_password: [{ required: true, validator: confirmPasswordValidator, trigger: 'blur' }]
}

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '未知'
}

async function handleChangePassword() {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    changing.value = true
    try {
      await authApi.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      })
      ElMessage.success('密码修改成功，请重新登录')
      userStore.logout()
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    } catch (error) {
      // 错误已在拦截器处理
    } finally {
      changing.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.profile-page {
  padding: 32px 48px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1C1C1E;
}

.profile-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
}

.info-card,
.password-card {
  border-radius: 16px;
  border: 1px solid #E5E5EA;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F5F5F7;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  width: 80px;
  font-size: 13px;
  color: #86868B;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #1C1C1E;
}
</style>
