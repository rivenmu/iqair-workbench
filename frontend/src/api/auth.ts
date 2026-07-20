import request from './request'

export const authApi = {
  login(data: { username: string; password: string }) {
    return request.post('/auth/login/', data)
  },

  register(data: { username: string; password: string; email?: string; phone?: string }) {
    return request.post('/auth/register/', data)
  },

  getCurrentUser() {
    return request.get('/auth/me/')
  },

  changePassword(data: { old_password: string; new_password: string }) {
    return request.post('/auth/change-password/', data)
  },

  // 用户管理（管理员）
  getUsers() {
    return request.get('/auth/users/')
  },

  createUser(data: { username: string; password: string; role: string; email?: string; phone?: string }) {
    return request.post('/auth/users/', data)
  },

  deleteUser(id: number) {
    return request.delete(`/auth/users/${id}/`)
  },

  resetPassword(id: number, data: { new_password: string }) {
    return request.post(`/auth/users/${id}/reset_password/`, data)
  }
}
