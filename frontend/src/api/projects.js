import request from './request';
export const projectsApi = {
    getProjects() { return request.get('/projects/'); },
    getProject(id) { return request.get(`/projects/${id}/`); },
    updateProject(id, data) { return request.patch(`/projects/${id}/`, data); },
    createProject(data) { return request.post('/projects/', data); },
    deleteProject(id) { return request.delete(`/projects/${id}/`); },
};
