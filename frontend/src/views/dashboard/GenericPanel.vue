<template>
  <div class="panel-placeholder">
    <div class="placeholder-card">
      <div class="icon-area">
        <el-icon size="56" color="#007AFF">
          <component :is="resolveIcon(project?.icon)" />
        </el-icon>
      </div>
      <h2 class="placeholder-title">{{ project?.name || '面板' }}</h2>
      <p class="placeholder-desc">{{ project?.description || '该面板正在开发中，敬请期待' }}</p>

      <div class="status-badge">
        <span class="status-dot"></span>
        <span class="status-text">网站建设中</span>
      </div>

      <div v-if="project" class="project-info">
        <div class="info-row">
          <span class="info-label">项目ID</span>
          <span class="info-value">{{ project.id }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">路由地址</span>
          <span class="info-value code">{{ project.route }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">图标名称</span>
          <span class="info-value code">{{ project.icon }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">排序权重</span>
          <span class="info-value">{{ project.sort_order }}</span>
        </div>
      </div>

      <p class="footer-tip">如需配置该面板内容，请联系管理员在后台进行设置。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Document as DocumentIcon } from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { projectsApi, type ProjectItem } from '@/api/projects'

const route = useRoute()
const project = ref<ProjectItem | null>(null)

function resolveIcon(iconName?: string) {
  if (!iconName) return DocumentIcon
  return (ElementPlusIconsVue as Record<string, any>)[iconName] || DocumentIcon
}

async function loadProject() {
  try {
    const projects = await projectsApi.getProjects()
    const currentPath = '/dashboard/' + (route.params.pathMatch || '')
    const found = (projects as ProjectItem[]).find(p => p.route === currentPath)
    project.value = found || null
  } catch {
    // ignore
  }
}

watch(() => route.fullPath, loadProject, { immediate: true })
</script>

<style scoped lang="scss">
.panel-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  overflow-y: auto;
}

.placeholder-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.05);
  padding: 48px;
  max-width: 560px;
  width: 100%;
  text-align: center;
}

.icon-area {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(90, 200, 250, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.placeholder-title {
  font-size: 28px;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0 0 8px;
}

.placeholder-desc {
  font-size: 15px;
  color: #86868B;
  margin: 0 0 28px;
  line-height: 1.6;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  border: 1px solid #F59E0B;
  margin-bottom: 32px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #F59E0B;
  animation: pulse 1.6s ease-in-out infinite;
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: #B45309;
  letter-spacing: 0.5px;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

.project-info {
  background: rgba(245, 245, 247, 0.6);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  text-align: left;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 13px;
  color: #86868B;
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  color: #1C1C1E;
  font-weight: 600;

  &.code {
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 12px;
    color: #007AFF;
  }
}

.footer-tip {
  font-size: 12px;
  color: #AEAEB2;
  margin: 0;
  line-height: 1.5;
}
</style>
