<template>
  <MainLayout>
    <div class="iqair-dashboard">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3 class="sidebar-title">{{ uiTexts.sidebarTitle || '配置面板' }}</h3>
          <p class="sidebar-sub">{{ uiTexts.sidebarSub || 'v3.0' }}</p>
        </div>

        <div class="sidebar-content">
          <!-- 品牌管理 -->
          <div class="sidebar-section">
            <div class="section-title">品牌管理</div>
            <div class="brand-list">
              <div v-for="(brand, idx) in brands" :key="idx" class="brand-row">
                <span class="brand-name" :style="{ color: brand.name === 'IQAir' ? '#D32F2F' : '#334155' }">
                  {{ brand.name }}
                </span>
                <el-upload
                  :show-file-list="false"
                  :before-upload="(file: any) => handleLogoUpload(file, idx)"
                  accept="image/*"
                >
                  <el-button size="small" :type="brand.logo ? 'success' : 'default'">
                    {{ brand.logo ? '已上传' : '上传 Logo' }}
                  </el-button>
                </el-upload>
              </div>
            </div>
          </div>

          <!-- 数据编辑 -->
          <div class="sidebar-section">
            <div class="section-title">数据编辑</div>
            <p class="section-desc">开启编辑模式后，可直接在数据表格中修改数值</p>
            <el-button
              :type="isEditMode ? 'success' : 'primary'"
              class="edit-toggle-btn"
              @click="toggleEditMode"
            >
              {{ isEditMode ? '保存修改' : '进入编辑模式' }}
            </el-button>
          </div>

          <!-- 快照与导出 -->
          <div class="sidebar-section">
            <div class="section-title">快照与导出</div>
            <el-button class="action-btn" @click="openSnapshotDialog">
              <el-icon><Camera /></el-icon> 保存快照
            </el-button>
            <el-button class="action-btn" @click="showHistoryDialog = true">
              <el-icon><Clock /></el-icon> 操作历史
            </el-button>
          </div>
        </div>
      </aside>

      <!-- 主展板区 -->
      <main class="main-workspace">
        <div class="dashboard-card">
          <div class="header-section">
            <h2 class="main-title">
              {{ uiTexts.mainTitle || '核心品牌滤芯营收及占比演变' }}
              <span class="mode-tag" :class="isEditMode ? 'edit-mode' : 'view-mode'">
                {{ isEditMode ? '正在编辑' : '只读预览' }}
              </span>
            </h2>
            <p class="main-desc">{{ uiTexts.mainDesc || '提示：数据根据最新期间滤芯销售额降序排列' }}</p>
          </div>

          <!-- ECharts 图表 -->
          <div ref="chartRef" class="chart-container"></div>

          <!-- 数据表格 -->
          <div class="table-section">
            <table class="data-table">
              <thead>
                <tr>
                  <th rowspan="2" class="brand-col">品牌 / 期间</th>
                  <th v-for="(period, idx) in periods" :key="idx" colspan="2">{{ period }}</th>
                </tr>
                <tr>
                  <template v-for="(period, idx) in periods" :key="idx">
                    <th class="sub-header">销售额 (元)</th>
                    <th class="sub-header">滤芯占比</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(brand, bIdx) in brands" :key="bIdx">
                  <td class="brand-col">
                    <div class="brand-cell">
                      <img v-if="brand.logo" :src="brand.logo" class="brand-logo" alt="logo" />
                      <div v-else class="logo-placeholder"></div>
                      <span :style="{ color: brand.name === 'IQAir' ? '#D32F2F' : brand.color }">
                        {{ brand.name }}
                      </span>
                    </div>
                  </td>
                  <template v-for="(period, yIdx) in periods" :key="yIdx">
                    <td v-if="isEditMode" contenteditable="true" class="editing-cell"
                        @input="handleDataChange($event, bIdx, yIdx, 'rev')">
                      {{ formatNum(brand.filterRev[yIdx]) }}
                    </td>
                    <td v-else>{{ formatNum(brand.filterRev[yIdx]) }}</td>
                    <td v-if="isEditMode" contenteditable="true" class="editing-cell"
                        @input="handleDataChange($event, bIdx, yIdx, 'pct')">
                      {{ brand.filterPct[yIdx] }}%
                    </td>
                    <td v-else>{{ brand.filterPct[yIdx] }}%</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <!-- 快照对话框 -->
      <el-dialog v-model="snapshotDialogVisible" title="保存快照" width="440px">
        <el-form>
          <el-form-item label="备注">
            <el-input v-model="snapshotNote" type="textarea" :rows="3" placeholder="可选：快照备注说明" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="snapshotDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateSnapshot" :loading="snapshotting">保存</el-button>
        </template>
      </el-dialog>

      <!-- 操作历史对话框 -->
      <el-dialog v-model="showHistoryDialog" title="操作历史" width="700px">
        <el-timeline>
          <el-timeline-item
            v-for="snap in snapshots"
            :key="snap.id"
            :timestamp="formatDate(snap.timestamp)"
            :type="snap.operation_type === 'restore' ? 'warning' : 'primary'"
          >
            <div class="history-item">
              <div class="history-header">
                <span class="history-action">{{ snap.operation_type_display }}</span>
                <el-tag size="small" :type="snap.is_manual ? 'success' : 'info'">
                  {{ snap.is_manual ? '手动' : '自动' }}
                </el-tag>
              </div>
              <p v-if="snap.note" class="history-note">{{ snap.note }}</p>
              <p class="history-user">操作人: {{ snap.username }}</p>
              <el-button
                v-if="snap.operation_type !== 'restore'"
                size="small"
                type="warning"
                @click="handleRestore(snap.id)"
              >
                撤销恢复
              </el-button>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-dialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Camera, Clock } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import MainLayout from '@/layouts/MainLayout.vue'
import { dashboardApi } from '@/api/dashboard'
import dayjs from 'dayjs'

const route = useRoute()
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const loading = ref(false)
const isEditMode = ref(false)
const projectId = ref(1)
const brands = ref<any[]>([])
const periods = ref<string[]>([])
const snapshots = ref<any[]>([])

const uiTexts = reactive({
  sidebarTitle: '配置面板',
  sidebarSub: 'v3.0',
  mainTitle: '核心品牌滤芯营收及占比演变',
  mainDesc: '提示：数据根据最新期间滤芯销售额降序排列'
})

const snapshotDialogVisible = ref(false)
const showHistoryDialog = ref(false)
const snapshotNote = ref('')
const snapshotting = ref(false)

function formatNum(num: number) {
  return Math.round(num).toLocaleString('zh-CN')
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

async function fetchData() {
  loading.value = true
  try {
    const data = await dashboardApi.getData(projectId.value)
    periods.value = data.periods || []
    brands.value = data.brands || []
    await nextTick()
    renderChart()
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

async function fetchSnapshots() {
  try {
    const data = await dashboardApi.getSnapshots(projectId.value)
    snapshots.value = Array.isArray(data) ? data : []
  } catch (error) {
    snapshots.value = []
  }
}

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const seriesData: any[] = []

  brands.value.forEach((brand) => {
    const isIQAir = brand.name === 'IQAir'
    const barColor = isIQAir ? '#D32F2F' : brand.color

    // 柱状图 - 营收
    seriesData.push({
      name: brand.name,
      type: 'bar',
      data: brand.filterRev,
      itemStyle: {
        color: isIQAir ? barColor : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: barColor },
          { offset: 1, color: barColor + '55' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      yAxisIndex: 0
    })

    // 折线图 - 占比
    seriesData.push({
      name: brand.name,
      type: 'line',
      data: brand.filterPct,
      yAxisIndex: 1,
      symbol: 'circle',
      symbolSize: isIQAir ? 8 : 6,
      itemStyle: { color: barColor, borderWidth: 2, borderColor: '#fff' },
      lineStyle: { width: isIQAir ? 3.5 : 2 }
    })
  })

  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: brands.value.map(b => b.name),
      top: 0,
      icon: 'circle',
      textStyle: { color: '#86868B', fontSize: 12 }
    },
    grid: { left: '1%', right: '1%', bottom: '0%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: periods.value,
      axisLine: { lineStyle: { color: '#D2D2D7' } },
      axisLabel: { color: '#1C1C1E', fontSize: 13, fontWeight: 'bold' }
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额 (元)',
        splitLine: { lineStyle: { color: '#F5F5F7', type: 'dashed' } },
        axisLabel: { color: '#86868B', fontSize: 11, formatter: (val: number) => val.toLocaleString('zh-CN') }
      },
      {
        type: 'value',
        name: '占比 (%)',
        splitLine: { show: false },
        axisLabel: { color: '#86868B', fontSize: 11, formatter: '{value}%' }
      }
    ],
    series: seriesData
  }

  chartInstance.setOption(option, true)
}

function toggleEditMode() {
  if (isEditMode.value) {
    // 退出编辑，保存数据
    saveData()
  }
  isEditMode.value = !isEditMode.value
}

async function saveData() {
  try {
    // 按最新期间降序排列
    const lastIdx = periods.value.length - 1
    brands.value.sort((a, b) => b.filterRev[lastIdx] - a.filterRev[lastIdx])

    await dashboardApi.saveData(projectId.value, {
      periods: periods.value,
      brands: brands.value
    })
    ElMessage.success('数据保存成功')
    renderChart()
    fetchSnapshots()
  } catch (error) {
    // 错误已在拦截器处理
  }
}

function handleDataChange(event: any, bIdx: number, yIdx: number, type: 'rev' | 'pct') {
  const val = parseFloat(event.target.innerText.replace(/,/g, '').replace('%', '').trim())
  if (isNaN(val)) return
  if (type === 'rev') {
    brands.value[bIdx].filterRev[yIdx] = val
  } else {
    brands.value[bIdx].filterPct[yIdx] = val
  }
}

async function handleLogoUpload(file: File, brandIndex: number) {
  const reader = new FileReader()
  reader.onload = async (e) => {
    brands.value[brandIndex].logo = e.target?.result as string
    renderChart()
    await saveData()
  }
  reader.readAsDataURL(file)
  return false
}

function openSnapshotDialog() {
  snapshotNote.value = ''
  snapshotDialogVisible.value = true
}

async function handleCreateSnapshot() {
  snapshotting.value = true
  try {
    await dashboardApi.createSnapshot(projectId.value, { note: snapshotNote.value })
    ElMessage.success('快照保存成功')
    snapshotDialogVisible.value = false
    fetchSnapshots()
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    snapshotting.value = false
  }
}

async function handleRestore(snapshotId: string) {
  try {
    await ElMessageBox.confirm('确定要恢复到此快照吗？当前数据将被覆盖。', '撤销确认', {
      confirmButtonText: '恢复',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await dashboardApi.restoreSnapshot(projectId.value, snapshotId)
    ElMessage.success('恢复成功')
    showHistoryDialog.value = false
    fetchData()
    fetchSnapshots()
  } catch (error) {
    // 用户取消或错误
  }
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  // 从路由参数获取 projectId
  if (route.params.projectId) {
    projectId.value = parseInt(route.params.projectId as string)
  }
  fetchData()
  fetchSnapshots()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(showHistoryDialog, (val) => {
  if (val) fetchSnapshots()
})
</script>

<style scoped lang="scss">
.iqair-dashboard {
  display: flex;
  height: calc(100vh - 60px);
  overflow: hidden;
}

// 侧边栏
.sidebar {
  width: 320px;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 24px 20px 16px;
  border-bottom: 1px solid #F5F5F7;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0;
}

.sidebar-sub {
  font-size: 12px;
  color: #86868B;
  margin: 4px 0 0;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.sidebar-section {
  padding: 20px;
  border-bottom: 1px solid #F5F5F7;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #AEAEB2;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.section-desc {
  font-size: 12px;
  color: #86868B;
  line-height: 1.5;
  margin-bottom: 12px;
}

.edit-toggle-btn,
.action-btn {
  width: 100%;
  margin-bottom: 8px;
}

.brand-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.brand-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #F5F5F7;
  border-radius: 8px;
  font-size: 13px;
}

.brand-name {
  font-weight: 500;
}

// 主展板区
.main-workspace {
  flex: 1;
  padding: 24px 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.05);
  width: 100%;
  height: 100%;
  max-height: 900px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-section {
  flex-shrink: 0;
}

.main-title {
  font-size: 24px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;

  &.view-mode {
    background: #E0F2FE;
    color: #0369A1;
  }

  &.edit-mode {
    background: #FEF3C7;
    color: #B45309;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.main-desc {
  font-size: 13px;
  color: #86868B;
}

.chart-container {
  width: 100%;
  flex: 1;
  min-height: 0;
}

// 数据表
.table-section {
  width: 100%;
  flex-shrink: 0;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  overflow: hidden;
  table-layout: fixed;
}

.data-table th,
.data-table td {
  border: 1px solid #D2D2D7;
  padding: 10px 8px;
  font-size: 13px;
  color: #1C1C1E;
}

.data-table th {
  background: rgba(234, 242, 253, 0.85);
  font-weight: 600;
}

.sub-header {
  font-weight: normal;
  background: rgba(245, 245, 247, 0.5);
}

.brand-col {
  font-weight: 600;
  text-align: left;
  padding-left: 16px;
  width: 22%;
}

.brand-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}

.logo-placeholder {
  width: 24px;
  height: 24px;
  background: #E5E5EA;
  border-radius: 4px;
}

.editing-cell {
  background: white !important;
  border: 2px dashed #007AFF !important;
  color: #007AFF !important;
  font-weight: 700 !important;
  outline: none;
  cursor: text;
}

// 历史记录
.history-item {
  padding: 8px 0;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.history-action {
  font-weight: 600;
  color: #1C1C1E;
}

.history-note {
  font-size: 13px;
  color: #86868B;
  margin: 4px 0;
}

.history-user {
  font-size: 12px;
  color: #AEAEB2;
  margin-bottom: 8px;
}
</style>
