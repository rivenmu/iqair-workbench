import request from './request'

export interface ProjectItem {
  id: number
  name: string
  description: string
  icon: string
  route: string
  thumbnail: string | null
  is_active: boolean
  sort_order: number
}

export const projectsApi = {
  getProjects() {
    return request.get('/projects/')
  }
}
