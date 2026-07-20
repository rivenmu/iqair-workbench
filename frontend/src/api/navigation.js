import request from './request';
export const navigationApi = {
    getLinks(params) {
        return request.get('/navigation/links/', { params });
    },
    getFavorites() {
        return request.get('/navigation/links/favorites/');
    },
    toggleFavorite(id) {
        return request.post(`/navigation/links/${id}/toggle_favorite/`);
    },
    createLink(data) {
        return request.post('/navigation/links/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    updateLink(id, data) {
        return request.patch(`/navigation/links/${id}/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    deleteLink(id) {
        return request.delete(`/navigation/links/${id}/`);
    },
    fetchIcon(id) {
        return request.post(`/navigation/links/${id}/fetch_icon/`);
    }
};
