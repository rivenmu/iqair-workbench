import request from './request'

export const dashboardApi = {
  // 获取看板数据
  getData(projectId: number) {
    return request.get(`/dashboard/${projectId}/data/`)
  },

  // 保存看板数据
  saveData(projectId: number, data: any) {
    return request.post(`/dashboard/${projectId}/data/`, data)
  },

  // 轻量保存 UI 文本（标题、表头等可编辑文案）
  saveUITexts(projectId: number, uiTexts: Record<string, string>) {
    return request.post(`/dashboard/${projectId}/ui-texts/`, { uiTexts })
  },

  // 品牌管理
  getBrands(projectId: number) {
    return request.get(`/dashboard/${projectId}/brands/`)
  },

  createBrand(projectId: number, data: { name: string; color?: string; logo?: string }) {
    return request.post(`/dashboard/${projectId}/brands/`, data)
  },

  deleteBrand(projectId: number, brandId: number) {
    return request.delete(`/dashboard/${projectId}/brands/${brandId}/`)
  },

  // 快照管理
  getSnapshots(projectId: number) {
    return request.get(`/snapshots/${projectId}/snapshots/`)
  },

  createSnapshot(projectId: number, data: { note?: string }) {
    return request.post(`/snapshots/${projectId}/snapshots/manual/`, data)
  },

  restoreSnapshot(projectId: number, snapshotId: string) {
    return request.post(`/snapshots/${projectId}/snapshots/${snapshotId}/restore/`)
  },

  // 操作日志
  getOperationLogs(params?: { module?: string }) {
    return request.get('/audit/logs/', { params })
  }
}

// ==================== 平台电商数据 ====================
export interface PlatformQueryParams {
  platform: 'tmall' | 'jd'
  period_type: 'daily' | 'weekly' | 'monthly'
  start_date?: string
  end_date?: string
}

export interface PlatformRecord {
  date: string
  label: string
  sales_amount: number
  order_count: number
  visitor_count: number
  paying_buyer_count: number
  conversion_rate: number
  unit_price: number
  cart_count: number
  favorite_count: number
  yoy_sales_amount: number | null
  yoy_order_count: number | null
  yoy_visitor_count: number | null
  yoy_conversion_rate: number | null
  yoy_growth: number | null
}

export interface PlatformSummary {
  total_sales: number
  total_orders: number
  total_visitors: number
  avg_conversion: number
  yoy_total_sales: number | null
  yoy_growth: number | null
  record_count: number
}

export interface PlatformDataResponse {
  platform: string
  platform_display: string
  period_type: string
  records: PlatformRecord[]
  summary: PlatformSummary | Record<string, never>
}

export interface DateRangeResponse {
  min_date: string | null
  max_date: string | null
  count: number
}

export const platformApi = {
  uploadExcel(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/dashboard/platform/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  queryData(params: PlatformQueryParams) {
    return request.get('/dashboard/platform/query/', { params }) as Promise<PlatformDataResponse>
  },

  getDateRange(platform: string, period_type: string) {
    return request.get('/dashboard/platform/range/', { params: { platform, period_type } }) as Promise<DateRangeResponse>
  },

  downloadTemplate() {
    return request.get('/dashboard/platform/template/', { responseType: 'blob' })
  }
}
