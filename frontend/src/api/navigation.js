import request from './request';
export const navigationApi = {
    getLinks(params) { return request.get('/navigation/links/', { params }); },
    getFavorites() { return request.get('/navigation/links/favorites/'); },
    toggleFavorite(id) { return request.post(`/navigation/links/${id}/toggle_favorite/`); },
    createLink(data) { return request.post('/navigation/links/', data); },
    updateLink(id, data) { return request.patch(`/navigation/links/${id}/`, data); },
    deleteLink(id) { return request.delete(`/navigation/links/${id}/`); },
    fetchIcon(id) { return request.post(`/navigation/links/${id}/fetch_icon/`); },
    fetchIconAsync(id) { return request.post(`/navigation/links/${id}/trigger_favicon_fetch/`); },
};
