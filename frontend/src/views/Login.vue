<template>
  <div class="login-container">
    <BlobBackground />
    <div class="login-card" :class="{ 'shake-error': showError }">
      <div class="logo-section">
        <div class="logo-icon">
          <el-icon size="40" color="#007AFF"><DataLine /></el-icon>
        </div>
        <h1 class="title">IQAir 工作台</h1>
        <p class="subtitle">数据分析与可视化平台</p>
      </div>
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="input-group">
          <el-input v-model="form.username" size="large" placeholder="用户名" :prefix-icon="User" clearable @keyup.enter="handleLogin" />
        </div>
        <div class="input-group">
          <el-input v-model="form.password" type="password" size="large" placeholder="密码" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
        </div>
        <div class="form-options">
          <el-checkbox v-model="form.remember">记住我（7天）</el-checkbox>
        </div>
        <el-button type="primary" size="large" class="login-button" :loading="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
        <transition name="fade">
          <div v-if="errorShown" class="error-message">
            <el-icon><WarningFilled /></el-icon>
            {{ errorMessage }}
          </div>
        </transition>
      </form>
      <div class="footer-hint">
        <span>还没有账号？</span>
        <a class="register-link" @click="goRegister">立即注册</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock, WarningFilled, DataLine } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import BlobBackground from '@/components/BlobBackground.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const showError = ref(false)
const errorShown = ref(false)
const errorMessage = ref('')
const form = reactive({ username: '', password: '', remember: false })

async function handleLogin() {
  if (!form.username || !form.password) { showLoginError('请输入用户名和密码'); return }
  loading.value = true
  try {
    await userStore.login({ username: form.username, password: form.password })
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (error: any) {
    showLoginError(error.response?.data?.detail || '用户名或密码错误')
  } finally { loading.value = false }
}

function showLoginError(msg: string) {
  errorMessage.value = msg
  showError.value = true
  errorShown.value = true
  setTimeout(() => { showError.value = false }, 500)
}

function goRegister() { router.push({ name: 'Register' }) }
</script>

<style scoped lang="scss">
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8edf5 100%);
  position: relative;
  overflow: hidden;
}
.login-card {
  position: relative;
  z-index: 1;
  width: 400px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.12);
  padding: 48px 40px;
  animation: slideInUp30 0.6s ease;
  &.shake-error { animation: shake 0.5s ease; }
}
.logo-section { text-align: center; margin-bottom: 32px; }
.logo-icon {
  width: 72px; height: 72px;
  border-radius: 20px;
  background: var(--color-accent-light);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}
.title { font-size: 24px; font-weight: 700; color: #1C1C1E; margin-bottom: 6px; }
.subtitle { font-size: 13px; color: #86868B; }
.login-form { display: flex; flex-direction: column; gap: 16px; }
.input-group { :deep(.el-input__wrapper) { background: rgba(255,255,255,0.6); border-radius: 12px; padding: 4px 12px; } }
.form-options { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #86868B; }
.login-button {
  width: 100%; height: 48px; font-size: 16px; font-weight: 600; border-radius: 12px; margin-top: 8px;
  transition: all 0.2s ease;
  &:active { transform: scale(0.98); }
}
.error-message {
  display: flex; align-items: center; gap: 6px;
  color: #FF3B30; font-size: 13px;
  padding: 8px 12px; background: rgba(255,59,48,0.08); border-radius: 8px; margin-top: 8px;
}
.footer-hint { text-align: center; margin-top: 24px; font-size: 13px; color: #86868B; }
.register-link { color: #007AFF; font-weight: 600; cursor: pointer; margin-left: 4px; &:hover { text-decoration: underline; } }
.fade-enter-active { transition: all 0.3s ease; }
.fade-enter-from { opacity: 0; transform: translateY(-10px); }
</style>
