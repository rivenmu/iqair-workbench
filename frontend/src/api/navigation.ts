﻿import request from './request'

export const navigationApi = {
  getLinks(params?: { category?: string }) {
    return request.get('/navigation/links/', { params })
  },

  createLink(data: FormData) {
    return request.post('/navigation/links/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  updateLink(id: number, data: FormData) {
    return request.patch(`/navigation/links/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  deleteLink(id: number) {
    return request.delete(`/navigation/links/${id}/`)
  },

  fetchIcon(id: number) {
    return request.post(`/navigation/links/${id}/fetch_icon/`)
  }
}
