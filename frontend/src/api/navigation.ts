import request from './request'

export const navigationApi = {
  getLinks(params?: { category?: string }) { return request.get('/navigation/links/', { params }) },
  getFavorites() { return request.get('/navigation/links/favorites/') },
  toggleFavorite(id: number) { return request.post(`/navigation/links/${id}/toggle_favorite/`) },
  createLink(data: Record<string, any>) { return request.post('/navigation/links/', data) },
  updateLink(id: number, data: Record<string, any>) { return request.patch(`/navigation/links/${id}/`, data) },
  deleteLink(id: number) { return request.delete(`/navigation/links/${id}/`) },
  fetchIcon(id: number) { return request.post(`/navigation/links/${id}/fetch_icon/`) },
  fetchIconAsync(id: number) { return request.post(`/navigation/links/${id}/trigger_favicon_fetch/`) },
}
