import request from './request';
export const authApi = {
    login(data) {
        return request.post('/auth/login/', data);
    },
    register(data) {
        return request.post('/auth/register/', data);
    },
    getCurrentUser() {
        return request.get('/auth/me/');
    },
    changePassword(data) {
        return request.post('/auth/change-password/', data);
    },
    // 用户管理（管理员）
    getUsers() {
        return request.get('/auth/users/');
    },
    createUser(data) {
        return request.post('/auth/users/', data);
    },
    deleteUser(id) {
        return request.delete(`/auth/users/${id}/`);
    },
    resetPassword(id, data) {
        return request.post(`/auth/users/${id}/reset_password/`, data);
    }
};
