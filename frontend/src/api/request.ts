import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const { response } = error

    if (response) {
      switch (response.status) {
        case 401: {
          const userStore = useUserStore()
          if (userStore.refreshToken && !error.config._retry) {
            error.config._retry = true
            try {
              const res = await axios.post('/api/token/refresh/', {
                refresh: userStore.refreshToken
              })
              userStore.token = res.data.access
              error.config.headers.Authorization = `Bearer ${res.data.access}`
              return axiosInstance(error.config)
            } catch {
              userStore.logout()
            }
          } else {
            userStore.logout()
          }
          break
        }
        case 403:
          ElMessage.error('无权访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误，请稍后再试')
          break
        default:
          ElMessage.error(response.data?.detail || '请求失败')
      }
    } else {
      ElMessage.error('网络连接异常')
    }
    return Promise.reject(error)
  }
)

interface RequestInstance {
  get<T = any>(url: string, config?: any): Promise<T>
  post<T = any>(url: string, data?: any, config?: any): Promise<T>
  put<T = any>(url: string, data?: any, config?: any): Promise<T>
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>
  delete<T = any>(url: string, config?: any): Promise<T>
}

const request = axiosInstance as unknown as RequestInstance

export default request
