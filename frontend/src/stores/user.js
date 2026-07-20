import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth';
export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('access_token') || '');
    const refreshToken = ref(localStorage.getItem('refresh_token') || '');
    const userInfo = ref(JSON.parse(localStorage.getItem('user_info') || 'null'));
    const isLoggedIn = computed(() => !!token.value);
    const isAdmin = computed(() => userInfo.value?.role === 'admin');
    const username = computed(() => userInfo.value?.username || '');
    async function login(loginData) {
        const res = await authApi.login(loginData);
        token.value = res.access;
        refreshToken.value = res.refresh;
        userInfo.value = res.user;
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        localStorage.setItem('user_info', JSON.stringify(res.user));
        return res;
    }
    function logout() {
        token.value = '';
        refreshToken.value = '';
        userInfo.value = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
    }
    async function fetchUserInfo() {
        const res = await authApi.getCurrentUser();
        userInfo.value = res;
        localStorage.setItem('user_info', JSON.stringify(res));
        return res;
    }
    return {
        token,
        refreshToken,
        userInfo,
        isLoggedIn,
        isAdmin,
        username,
        login,
        logout,
        fetchUserInfo
    };
});
