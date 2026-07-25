import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import router from '@/router';
const axiosInstance = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
});
const NAV_PATH = '/navigation';
axiosInstance.interceptors.request.use((config) => {
    const userStore = useUserStore();
    if (userStore.token) {
        config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
}, (error) => Promise.reject(error));
axiosInstance.interceptors.response.use((response) => response.data, async (error) => {
    const { response, config } = error;
    if (!response) {
        ElMessage.error('网络连接异常');
        return Promise.reject(error);
    }
    const isNavPath = config?.url?.includes(NAV_PATH);
    switch (response.status) {
        case 401: {
            const userStore = useUserStore();
            if (userStore.refreshToken && !config._retry) {
                config._retry = true;
                try {
                    const res = await axios.post('/api/auth/token/refresh/', { refresh: userStore.refreshToken });
                    userStore.token = res.data.access;
                    config.headers.Authorization = `Bearer ${res.data.access}`;
                    return axiosInstance(config);
                }
                catch {
                    userStore.logout();
                    if (!isNavPath) {
                        router.push('/login');
                        ElMessage.error('登录已过期，请重新登录');
                    }
                    return Promise.reject(error);
                }
            }
            userStore.logout();
            if (!isNavPath) {
                router.push('/login');
                ElMessage.error('请先登录');
            }
            return Promise.reject(error);
        }
        case 403:
            if (!isNavPath)
                ElMessage.error('无权访问');
            break;
        case 404:
            if (!isNavPath)
                ElMessage.error('请求的资源不存在');
            break;
        case 500:
            if (!isNavPath)
                ElMessage.error('服务器错误，请稍后再试');
            break;
        default: if (!isNavPath)
            ElMessage.error(response.data?.detail || '请求失败');
    }
    return Promise.reject(error);
});
const request = axiosInstance;
export default request;
