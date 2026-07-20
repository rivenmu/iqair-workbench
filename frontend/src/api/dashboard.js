import request from './request';
export const dashboardApi = {
    // 获取看板数据
    getData(projectId) {
        return request.get(`/dashboard/${projectId}/data/`);
    },
    // 保存看板数据
    saveData(projectId, data) {
        return request.post(`/dashboard/${projectId}/data/`, data);
    },
    // 轻量保存 UI 文本（标题、表头等可编辑文案）
    saveUITexts(projectId, uiTexts) {
        return request.post(`/dashboard/${projectId}/ui-texts/`, { uiTexts });
    },
    // 品牌管理
    getBrands(projectId) {
        return request.get(`/dashboard/${projectId}/brands/`);
    },
    createBrand(projectId, data) {
        return request.post(`/dashboard/${projectId}/brands/`, data);
    },
    deleteBrand(projectId, brandId) {
        return request.delete(`/dashboard/${projectId}/brands/${brandId}/`);
    },
    // 快照管理
    getSnapshots(projectId) {
        return request.get(`/snapshots/${projectId}/snapshots/`);
    },
    createSnapshot(projectId, data) {
        return request.post(`/snapshots/${projectId}/snapshots/manual/`, data);
    },
    restoreSnapshot(projectId, snapshotId) {
        return request.post(`/snapshots/${projectId}/snapshots/${snapshotId}/restore/`);
    },
    // 操作日志
    getOperationLogs(params) {
        return request.get('/audit/logs/', { params });
    }
};
export const platformApi = {
    uploadExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        return request.post('/dashboard/platform/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    queryData(params) {
        return request.get('/dashboard/platform/query/', { params });
    },
    getDateRange(platform, period_type) {
        return request.get('/dashboard/platform/range/', { params: { platform, period_type } });
    },
    downloadTemplate() {
        return request.get('/dashboard/platform/template/', { responseType: 'blob' });
    }
};
