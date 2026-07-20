import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 8888,
      allowedHosts: ['iqair.rivenmu.cn'],
      // 开发模式下代理 API 请求到后端
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://10.0.0.6:8000',
          changeOrigin: true,
        },
        '/media': {
          target: env.VITE_API_BASE_URL || 'http://10.0.0.6:8000',
          changeOrigin: true,
        },
        '/admin': {
          target: env.VITE_API_BASE_URL || 'http://10.0.0.6:8000',
          changeOrigin: true,
        },
        '/static': {
          target: env.VITE_API_BASE_URL || 'http://10.0.0.6:8000',
          changeOrigin: true,
        },
        '/bi': {
          target: 'http://10.0.0.6:8100',
          changeOrigin: true,
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 全局注入设计 Token 变量
          additionalData: `@use "@/styles/tokens.scss" as *;`,
        },
      },
    },
  }
})
