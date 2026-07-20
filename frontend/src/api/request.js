import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import router from '@/router';
const request = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});
// 请求拦截器
request.interceptors.request.use((config) => {
    const userStore = useUserStore();
    if (userStore.token) {
        config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
}, (error) => Promise.reject(error));
// 响应拦截器
request.interceptors.response.use((response) => {
    return response.data;
}, async (error) => {
    const { response } = error;
    if (response) {
        switch (response.status) {
            case 401: {
                // token 过期，尝试刷新
                const userStore = useUserStore();
                if (userStore.refreshToken && !error.config._retry) {
                    error.config._retry = true;
                    try {
                        const res = await axios.post('/api/auth/token/refresh/', {
                            refresh: userStore.refreshToken
                        });
                        userStore.token = res.data.access;
                        error.config.headers.Authorization = `Bearer ${res.data.access}`;
                        return request(error.config);
                    }
                    catch {
                        userStore.logout();
                        router.push('/login');
                        ElMessage.error('登录已过期，请重新登录');
                    }
                }
                else {
                    userStore.logout();
                    router.push('/login');
                    ElMessage.error('请先登录');
                }
                break;
            }
            case 403:
                ElMessage.error('无权访问');
                break;
            case 404:
                ElMessage.error('请求的资源不存在');
                break;
            case 500:
                ElMessage.error('服务器错误，请稍后再试');
                break;
            default:
                ElMessage.error(response.data?.detail || '请求失败');
        }
    }
    else {
        ElMessage.error('网络连接异常');
    }
    return Promise.reject(error);
});
export default request;
