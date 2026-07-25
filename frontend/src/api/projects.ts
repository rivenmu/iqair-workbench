import request from './request'

export interface ProjectItem {
  id: number; name: string; description: string; icon: string; route: string
  thumbnail?: string; is_active: boolean; sort_order: number
  is_featured: boolean; gradient_color: string; subtitle: string; icon_type: string
}

export const projectsApi = {
  getProjects() { return request.get('/projects/') },
  getProject(id: number) { return request.get(`/projects/${id}/`) },
  updateProject(id: number, data: Partial<ProjectItem>) { return request.patch(`/projects/${id}/`, data) },
  createProject(data: Partial<ProjectItem>) { return request.post('/projects/', data) },
  deleteProject(id: number) { return request.delete(`/projects/${id}/`) },
}
