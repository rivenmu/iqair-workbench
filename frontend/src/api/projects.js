import request from './request';
export const projectsApi = {
    getProjects() {
        return request.get('/projects/');
    }
};
