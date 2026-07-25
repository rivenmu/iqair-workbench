<template>
  <div class="register-container">
    <BlobBackground />
    <div class="register-card" :class="{ 'shake-error': showError }">
      <div class="logo-section">
        <div class="logo-icon">
          <el-icon size="40" color="#007AFF"><DataLine /></el-icon>
        </div>
        <h1 class="title">注册账号</h1>
        <p class="subtitle">加入 IQAir 工作台</p>
      </div>
      <form class="register-form" @submit.prevent="handleRegister">
        <div class="input-group">
          <el-input v-model="form.username" size="large" placeholder="用户名" :prefix-icon="User" clearable @keyup.enter="handleRegister" />
        </div>
        <div class="input-group">
          <el-input v-model="form.password" type="password" size="large" placeholder="密码" :prefix-icon="Lock" show-password @keyup.enter="handleRegister" />
        </div>
        <div class="input-group">
          <el-input v-model="form.confirmPassword" type="password" size="large" placeholder="确认密码" :prefix-icon="Lock" show-password @keyup.enter="handleRegister" />
        </div>
        <div class="input-group">
          <el-input v-model="form.email" size="large" placeholder="邮箱（选填）" :prefix-icon="Message" clearable @keyup.enter="handleRegister" />
        </div>
        <div class="input-group">
          <el-input v-model="form.phone" size="large" placeholder="手机号（选填）" :prefix-icon="Phone" clearable @keyup.enter="handleRegister" />
        </div>
        <el-button type="primary" size="large" class="register-button" :loading="loading" @click="handleRegister">
          {{ loading ? '注册中...' : '注 册' }}
        </el-button>
        <transition name="fade"><div v-if="errorShown" class="error-message"><el-icon><WarningFilled /></el-icon>{{ errorMessage }}</div></transition>
        <transition name="fade"><div v-if="successShown" class="success-message"><el-icon><CircleCheckFilled /></el-icon>{{ successMessage }}</div></transition>
      </form>
      <div class="footer-hint"><span>已有账号？</span><a class="login-link" @click="goLogin">返回登录</a></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message, Phone, WarningFilled, CircleCheckFilled, DataLine } from '@element-plus/icons-vue'
import { authApi } from '@/api/auth'
import BlobBackground from '@/components/BlobBackground.vue'

const router = useRouter()
const loading = ref(false)
const showError = ref(false)
const errorShown = ref(false)
const errorMessage = ref('')
const successShown = ref(false)
const successMessage = ref('')
const form = reactive({ username: '', password: '', confirmPassword: '', email: '', phone: '' })

function showFieldError(msg: string) {
  errorMessage.value = msg; showError.value = true; errorShown.value = true; successShown.value = false
  setTimeout(() => { showError.value = false }, 500)
}

async function handleRegister() {
  errorShown.value = false; successShown.value = false
  if (!form.username || !form.password) { showFieldError('请输入用户名和密码'); return }
  if (form.password !== form.confirmPassword) { showFieldError('两次输入的密码不一致'); return }
  loading.value = true
  try {
    await authApi.register({ username: form.username, password: form.password, email: form.email || undefined, phone: form.phone || undefined })
    successMessage.value = '注册成功，即将跳转到登录页...'
    successShown.value = true; errorShown.value = false
    setTimeout(() => { router.push({ name: 'Login' }) }, 1500)
  } catch (error: any) {
    const errData = error.response?.data
    if (errData) {
      if (errData.username) showFieldError(Array.isArray(errData.username) ? errData.username[0] : errData.username)
      else if (errData.password) showFieldError(Array.isArray(errData.password) ? errData.password[0] : errData.password)
      else showFieldError(errData.detail || '注册失败，请稍后重试')
    } else { showFieldError('网络异常，请稍后重试') }
  } finally { loading.value = false }
}

function goLogin() { router.push({ name: 'Login' }) }
</script>

<style scoped lang="scss">
.register-container {
  height: 100vh; width: 100vw;
  display: flex; justify-content: center; align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8edf5 100%);
  position: relative; overflow: hidden; padding: 20px;
}
.register-card {
  position: relative; z-index: 1; width: 400px; max-height: 90vh; overflow-y: auto;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
  border-radius: 24px; border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 24px 80px rgba(0,0,0,0.12); padding: 40px;
  animation: slideInUp30 0.6s ease;
  &.shake-error { animation: shake 0.5s ease; }
}
.logo-section { text-align: center; margin-bottom: 24px; }
.logo-icon {
  width: 72px; height: 72px; border-radius: 20px;
  background: var(--color-accent-light);
  display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
}
.title { font-size: 24px; font-weight: 700; color: #1C1C1E; margin-bottom: 6px; }
.subtitle { font-size: 13px; color: #86868B; }
.register-form { display: flex; flex-direction: column; gap: 14px; }
.input-group { :deep(.el-input__wrapper) { background: rgba(255,255,255,0.6); border-radius: 12px; padding: 4px 12px; } }
.register-button { width: 100%; height: 48px; font-size: 16px; font-weight: 600; border-radius: 12px; margin-top: 8px; transition: all 0.2s ease; &:active { transform: scale(0.98); } }
.error-message { display: flex; align-items: center; gap: 6px; color: #FF3B30; font-size: 13px; padding: 8px 12px; background: rgba(255,59,48,0.08); border-radius: 8px; margin-top: 4px; }
.success-message { display: flex; align-items: center; gap: 6px; color: #34C759; font-size: 13px; padding: 8px 12px; background: rgba(52,199,89,0.08); border-radius: 8px; margin-top: 4px; }
.footer-hint { text-align: center; margin-top: 20px; font-size: 13px; color: #86868B; }
.login-link { color: #007AFF; font-weight: 600; cursor: pointer; margin-left: 4px; &:hover { text-decoration: underline; } }
.fade-enter-active { transition: all 0.3s ease; }
.fade-enter-from { opacity: 0; transform: translateY(-10px); }
</style>
