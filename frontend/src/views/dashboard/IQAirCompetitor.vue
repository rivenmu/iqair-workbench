<template>
  <div class="iqair-competitor">
    <!-- 左侧数据修改面板 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3 class="sidebar-title">{{ uiTexts.sidebarTitle || '配置面板' }}</h3>
        <p class="sidebar-sub">{{ uiTexts.sidebarSub || '双模态联动 v3.0' }}</p>
      </div>

      <div class="sidebar-content">
        <!-- 品牌管理 -->
        <div class="sidebar-section">
          <div class="section-title">品牌管理</div>
          <div class="brand-list">
            <div
              v-for="(brand, idx) in brands"
              :key="idx"
              class="brand-row"
              :class="{ 'is-iqair': isIQAirBrand(brand.name) }"
            >
              <el-checkbox
                class="brand-check"
                :model-value="brand.visible !== false"
                @change="toggleBrandVisibility(brand, $event)"
              >
                <span class="brand-name" :style="{ color: isIQAirBrand(brand.name) ? '#D32F2F' : '#334155' }">
                  {{ brand.name }}
                </span>
              </el-checkbox>
              <el-upload
                :show-file-list="false"
                :before-upload="(file: any) => handleLogoUpload(file, idx)"
                accept="image/*"
              >
                <el-button size="small" :type="brand.logo ? 'success' : 'default'" plain>
                  {{ brand.logo ? '已上传 ✓' : '上传 Logo' }}
                </el-button>
              </el-upload>
            </div>
          </div>
        </div>

        <!-- 数据编辑 -->
        <div class="sidebar-section">
          <div class="section-title">数据编辑</div>
          <p class="section-desc">
            {{ uiTexts.sec2Desc || '点击开启编辑模式，直接在右侧图表下方的数据表格内输入或修改数值，实时映射至柱状图。' }}
          </p>
          <el-button
            :type="isEditMode ? 'success' : 'primary'"
            class="edit-toggle-btn"
            @click="toggleEditMode"
          >
            <el-icon><Edit v-if="!isEditMode" /><Check v-else /></el-icon>
            {{ isEditMode ? '保存修改' : '进入编辑模式' }}
          </el-button>
          <div class="mode-indicator" :class="isEditMode ? 'mode-edit' : 'mode-view'">
            {{ isEditMode ? '正在编辑' : '只读预览' }}
          </div>
        </div>

        <!-- 图表标签 -->
        <div class="sidebar-section">
          <div class="section-title">图表标签</div>
          <div class="chart-label-list">
            <div class="chart-label-row">
              <span>销售额图例</span>
              <span class="editable-text chart-label-value" :contenteditable="isEditMode" @blur="saveUIText($event, 'chartLegendSales')">
                {{ uiTexts.chartLegendSales || '滤芯销售额XX' }}
              </span>
            </div>
            <div class="chart-label-row">
              <span>占比图例</span>
              <span class="editable-text chart-label-value" :contenteditable="isEditMode" @blur="saveUIText($event, 'chartLegendPct')">
                {{ uiTexts.chartLegendPct || '滤芯占比XX' }}
              </span>
            </div>
            <div class="chart-label-row">
              <span>一级横轴</span>
              <span class="editable-text chart-label-value" :contenteditable="isEditMode" @blur="saveUIText($event, 'xAxisBrand')">
                {{ uiTexts.xAxisBrand || '品牌XX' }}
              </span>
            </div>
            <div class="chart-label-row">
              <span>二级横轴</span>
              <span class="editable-text chart-label-value" :contenteditable="isEditMode" @blur="saveUIText($event, 'xAxisTime')">
                {{ uiTexts.xAxisTime || '时间' }}
              </span>
            </div>
            <div class="chart-label-row">
              <span>左侧纵轴</span>
              <span class="editable-text chart-label-value" :contenteditable="isEditMode" @blur="saveUIText($event, 'yAxisSales')">
                {{ uiTexts.yAxisSales || '销售额 (元)' }}
              </span>
            </div>
            <div class="chart-label-row">
              <span>右侧纵轴</span>
              <span class="editable-text chart-label-value" :contenteditable="isEditMode" @blur="saveUIText($event, 'yAxisPct')">
                {{ uiTexts.yAxisPct || '滤芯占比 (%)' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 快照与历史 -->
        <div class="sidebar-section">
          <div class="section-title">快照与历史</div>
          <el-button class="action-btn" @click="openSnapshotDialog" :disabled="!brands.length">
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
        <!-- 标题区 -->
        <div class="header-section">
          <h2 class="main-title">
            <span
              class="editable-text"
              :contenteditable="isEditMode"
              @blur="saveUIText($event, 'mainTitle')"
            >{{ uiTexts.mainTitle || '核心品牌滤芯销售额及占比演变' }}</span>
            <span class="main-sub" :contenteditable="isEditMode" @blur="saveUIText($event, 'mainSubSpan')">
              {{ uiTexts.mainSubSpan || '(2024 H1 - 2026 H1)' }}
            </span>
          </h2>
          <p class="main-desc">
            <span class="editable-text" :contenteditable="isEditMode" @blur="saveUIText($event, 'mainDesc')">
              {{ uiTexts.mainDesc || '数据按 2026 H1 滤芯销售额降序排列；横轴按品牌分组展示三个半年度数据' }}
            </span>
          </p>
        </div>

        <!-- ECharts 图表 -->
        <div ref="chartRef" class="chart-container"></div>

        <!-- 数据表格 -->
        <div class="table-section">
          <table class="data-table">
            <thead>
              <tr>
                <th rowspan="2" class="brand-col">
                  <span class="editable-text" :contenteditable="isEditMode" @blur="saveUIText($event, 'thBrand')">
                    {{ uiTexts.thBrand || '品牌 / 期间' }}
                  </span>
                </th>
                <th v-for="(period, idx) in periods" :key="idx" colspan="2">
                  <span class="editable-text" :contenteditable="isEditMode" @blur="saveUIText($event, 'thYear_' + idx)">
                    {{ period }}
                  </span>
                </th>
              </tr>
              <tr>
              <template v-for="(period, idx) in periods" :key="idx">
                <th class="sub-header">
                  <span class="editable-text" :contenteditable="isEditMode" @blur="saveUIText($event, 'thSales')">
                    {{ uiTexts.thSales || '销售额 (元)' }}
                  </span>
                </th>
                <th class="sub-header">
                  <span class="editable-text" :contenteditable="isEditMode" @blur="saveUIText($event, 'thPct')">
                    {{ uiTexts.thPct || '滤芯占比' }}
                  </span>
                </th>
              </template>
            </tr>
            </thead>
            <tbody>
              <tr v-for="brand in visibleBrands" :key="brand.name">
                <td class="brand-col">
                  <div class="brand-cell">
                    <img
                      v-if="brand.logo || isIQAirBrand(brand.name)"
                      :src="brand.logo || defaultIQAirLogo"
                      class="brand-logo"
                      alt="logo"
                    />
                    <div v-else class="logo-placeholder"></div>
                    <span
                      class="editable-text brand-name-cell"
                      :contenteditable="isEditMode"
                      :style="{
                        color: isIQAirBrand(brand.name) ? '#D32F2F' : brand.color,
                        fontWeight: isIQAirBrand(brand.name) ? '700' : '600'
                      }"
                      @blur="updateBrandName($event, brand)"
                    >{{ brand.name }}</span>
                  </div>
                </td>
                <template v-for="(period, yIdx) in periods" :key="yIdx">
                  <td
                    v-if="isEditMode"
                    contenteditable="true"
                    class="editing-cell"
                    @input="handleDataChange($event, brand, yIdx, 'rev')"
                  >{{ brand.filterRev[yIdx] }}</td>
                  <td v-else>{{ formatNum(brand.filterRev[yIdx]) }}</td>
                  <td
                    v-if="isEditMode"
                    contenteditable="true"
                    class="editing-cell"
                    @input="handleDataChange($event, brand, yIdx, 'pct')"
                  >{{ brand.filterPct[yIdx] }}</td>
                  <td v-else>{{ brand.filterPct[yIdx] }}%</td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 备注栏 -->
        <div class="note-bar">
          <span class="note-label">备注 / Remarks</span>
          <span
            class="editable-text note-content"
            :contenteditable="isEditMode"
            @blur="saveUIText($event, 'footerNote')"
          >{{ uiTexts.footerNote }}</span>
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
      <el-timeline v-if="snapshots.length">
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
      <el-empty v-else description="暂无操作历史" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Check, Camera, Clock } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { dashboardApi } from '@/api/dashboard'
import dayjs from 'dayjs'

const PROJECT_ID = 1
const STORAGE_KEY = 'iqair_dashboard_state_v3'
const DATA_VERSION = 'competitor-data-v2'

const defaultIQAirLogo = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23D32F2F' rx='20'/><text x='50' y='65' font-family='Arial' font-size='40' font-weight='bold' fill='white' text-anchor='middle'>IQ</text></svg>"

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null
let updateTimer: ReturnType<typeof setTimeout> | null = null

const loading = ref(false)
const isEditMode = ref(false)
const brands = ref<any[]>([])
const periods = ref<string[]>([])
const snapshots = ref<any[]>([])
const visibleBrands = computed(() => brands.value.filter(brand => brand.visible !== false))

const uiTexts = reactive<Record<string, string>>({
  sidebarTitle: '配置面板',
  sidebarSub: '双模态联动 v3.0',
  mainTitle: '核心品牌滤芯销售额及占比演变',
  mainSubSpan: '(2024 H1 - 2026 H1)',
  mainDesc: '数据按 2026 H1 滤芯销售额降序排列；横轴按品牌分组展示三个半年度数据',
  thBrand: '品牌 / 期间',
  thSales: '销售额 (元)',
  thPct: '滤芯占比',
  chartLegendSales: '滤芯销售额',
  chartLegendPct: '滤芯占比',
  xAxisBrand: '品牌',
  xAxisTime: '时间',
  yAxisSales: '销售额 (元)',
  yAxisPct: '滤芯占比 (%)',
  footerNote: '',
  competitorDataVersion: DATA_VERSION,
})

const snapshotDialogVisible = ref(false)
const showHistoryDialog = ref(false)
const snapshotNote = ref('')
const snapshotting = ref(false)

// 默认数据
const defaultData = {
  periods: ['2024 H1', '2025 H1', '2026 H1'],
  brands: [
    { name: 'Honeywell / 霍尼韦尔', color: '#64748B', filterRev: [5593000, 10047000, 15380000], filterPct: [4, 8, 10], logo: '', visible: true },
    { name: 'MIJIA / 米家', color: '#10B981', filterRev: [10771000, 7409000, 11059000], filterPct: [9, 3, 8], logo: '', visible: true },
    { name: 'Midea / 美的', color: '#A855F7', filterRev: [1291000, 1501000, 1526000], filterPct: [3, 3, 1], logo: '', visible: true },
    { name: '352', color: '#8B5CF6', filterRev: [4850000, 7894000, 7547000], filterPct: [10, 16, 16], logo: '', visible: true },
    { name: 'AIRPROCE / 艾泊斯', color: '#F59E0B', filterRev: [2451000, 3225000, 4721000], filterPct: [11, 12, 16], logo: '', visible: true },
    { name: 'Philips / 飞利浦', color: '#6366F1', filterRev: [2398000, 1786000, 2255000], filterPct: [12, 14, 14], logo: '', visible: true },
    { name: 'SOLEUSAIR', color: '#14B8A6', filterRev: [2201000, 1732000, 1820000], filterPct: [8, 7, 11], logo: '', visible: true },
    { name: 'IQAIR', color: '#D32F2F', filterRev: [4222000, 3909000, 4549000], filterPct: [31, 24, 26], logo: '', visible: true },
    { name: 'BLUEAIR / 布鲁雅尔', color: '#0EA5E9', filterRev: [11135000, 9784000, 7757000], filterPct: [42, 52, 40], logo: '', visible: true },
    { name: 'IAM', color: '#EC4899', filterRev: [2369000, 2790000, 2646000], filterPct: [6, 10, 20], logo: '', visible: true },
  ]
}

function isIQAirBrand(name: string) {
  return name?.trim().toLowerCase() === 'iqair'
}

function formatNum(num: number) {
  return Math.round(num).toLocaleString('zh-CN')
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// ================== 数据加载 ==================
async function fetchData() {
  loading.value = true
  try {
    const data: any = await dashboardApi.getData(PROJECT_ID)
    // 优先使用后端返回的 UI 文本（跨环境/跨域名共享的权威源）
    if (data.uiTexts && typeof data.uiTexts === 'object') {
      Object.keys(uiTexts).forEach((k) => { delete uiTexts[k] })
      Object.assign(uiTexts, data.uiTexts)
    }

    // 通过版本号执行一次数据升级，确保已有项目也切换到最新的 10 品牌数据。
    if (data.uiTexts?.competitorDataVersion !== DATA_VERSION) {
      periods.value = defaultData.periods
      brands.value = cloneDefaultBrands()
      mergeLocalBrandPreferences()
      uiTexts.competitorDataVersion = DATA_VERSION
      await saveDataToBackend(false)
    } else if (data.brands && data.brands.length > 0) {
      periods.value = data.periods || []
      brands.value = normalizeBrands(data.brands)
      mergeLocalBrandPreferences()
    } else {
      periods.value = defaultData.periods
      brands.value = cloneDefaultBrands()
      uiTexts.competitorDataVersion = DATA_VERSION
      await saveDataToBackend(false)
    }
    pipelineProcessData()
    await nextTick()
    renderChart()
  } catch (error) {
    // 后端请求失败，尝试从 localStorage 加载
    loadFromLocalStorage()
  } finally {
    loading.value = false
  }
}

function cloneDefaultBrands() {
  return JSON.parse(JSON.stringify(defaultData.brands))
}

function normalizeBrands(brandList: any[]) {
  return brandList.map((brand) => ({
    ...brand,
    visible: brand.visible !== false
  }))
}

function mergeLocalBrandPreferences() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return
  try {
    const state = JSON.parse(saved)
    if (state.brands && brands.value.length > 0) {
      state.brands.forEach((savedBrand: any) => {
        const currentBrand = brands.value.find(brand => brand.name === savedBrand.name)
        if (!currentBrand) return
        if (savedBrand.logo && !currentBrand.logo) currentBrand.logo = savedBrand.logo
        if (typeof savedBrand.visible === 'boolean') currentBrand.visible = savedBrand.visible
      })
    }
  } catch {
    // 解析失败，忽略
  }
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const state = JSON.parse(saved)
      const needsSeed = state.dataVersion !== DATA_VERSION && state.uiTexts?.competitorDataVersion !== DATA_VERSION
      periods.value = needsSeed ? defaultData.periods : (state.periods || defaultData.periods)
      brands.value = needsSeed ? cloneDefaultBrands() : normalizeBrands(state.brands || cloneDefaultBrands())
      if (state.uiTexts) {
        Object.assign(uiTexts, state.uiTexts)
      }
      uiTexts.competitorDataVersion = DATA_VERSION
      mergeLocalBrandPreferences()
    } catch {
      periods.value = defaultData.periods
      brands.value = cloneDefaultBrands()
      uiTexts.competitorDataVersion = DATA_VERSION
    }
  } else {
    periods.value = defaultData.periods
    brands.value = cloneDefaultBrands()
    uiTexts.competitorDataVersion = DATA_VERSION
  }
  pipelineProcessData()
  nextTick(() => renderChart())
}

function persistToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    dataVersion: DATA_VERSION,
    periods: periods.value,
    brands: brands.value,
    uiTexts: uiTexts
  }))
}

async function fetchSnapshots() {
  try {
    const data = await dashboardApi.getSnapshots(PROJECT_ID)
    snapshots.value = Array.isArray(data) ? data : []
  } catch {
    snapshots.value = []
  }
}

// ================== 数据处理 ==================
function pipelineProcessData() {
  if (!isEditMode.value && brands.value.length > 0) {
    const lastIdx = periods.value.length - 1
    if (lastIdx >= 0) {
      brands.value.sort((a, b) => (b.filterRev[lastIdx] || 0) - (a.filterRev[lastIdx] || 0))
    }
  }
}

// ================== 编辑模式 ==================
function toggleEditMode() {
  if (isEditMode.value) {
    // 退出编辑模式，保存数据
    pipelineProcessData()
    saveDataToBackend(true)
    renderChart()
  }
  isEditMode.value = !isEditMode.value
  ElMessage.success(isEditMode.value ? '已进入编辑模式' : '修改已保存')
}

function toggleBrandVisibility(brand: any, checked: boolean) {
  brand.visible = checked
  persistToLocalStorage()
  nextTick(() => renderChart())
}

async function saveDataToBackend(showMessage: boolean) {
  persistToLocalStorage()
  try {
    await dashboardApi.saveData(PROJECT_ID, {
      periods: periods.value,
      brands: brands.value,
      uiTexts: { ...uiTexts }
    })
    if (showMessage) {
      fetchSnapshots()
    }
  } catch {
    // 后端保存失败，数据已在 localStorage
  }
}

// ================== UI 文本编辑 ==================
let uiTextSyncTimer: ReturnType<typeof setTimeout> | null = null
function saveUIText(event: any, key: string) {
  if (!isEditMode.value) return
  const newValue = event.target.innerText.trim()
  if (uiTexts[key] === newValue) return
  uiTexts[key] = newValue
  persistToLocalStorage()
  if (['chartLegendSales', 'chartLegendPct', 'xAxisBrand', 'xAxisTime', 'yAxisSales', 'yAxisPct'].includes(key)) {
    renderChart()
  }
  // 防抖同步到后端，确保局域网/外网/不同浏览器一致
  if (uiTextSyncTimer) clearTimeout(uiTextSyncTimer)
  uiTextSyncTimer = setTimeout(async () => {
    try {
      await dashboardApi.saveUITexts(PROJECT_ID, { [key]: newValue })
    } catch {
      // 后端同步失败，localStorage 仍保留，恢复网络后可下次触发时重试
    }
  }, 400)
}

function flushUiTextSync() {
  if (uiTextSyncTimer) {
    clearTimeout(uiTextSyncTimer)
    uiTextSyncTimer = null
  }
  dashboardApi.saveUITexts(PROJECT_ID, { ...uiTexts }).catch(() => {})
}

function updateBrandName(event: any, brand: any) {
  if (!isEditMode.value) return
  brand.name = event.target.innerText.trim()
  persistToLocalStorage()
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(() => renderChart(), 300)
}

// ================== 数据修改 ==================
function handleDataChange(event: any, brand: any, yIdx: number, type: 'rev' | 'pct') {
  let val = parseFloat(event.target.innerText.replace(/,/g, '').replace('%', '').trim())
  if (isNaN(val)) val = 0
  if (type === 'rev') {
    brand.filterRev[yIdx] = val
  } else {
    brand.filterPct[yIdx] = val
  }
  // 防抖热重绘图表
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(() => {
    persistToLocalStorage()
    renderChart()
  }, 300)
}

// ================== Logo 上传 ==================
async function handleLogoUpload(file: File, brandIndex: number) {
  const reader = new FileReader()
  reader.onload = async (e) => {
    brands.value[brandIndex].logo = e.target?.result as string
    persistToLocalStorage()
    renderChart()
    await saveDataToBackend(false)
    ElMessage.success(`${brands.value[brandIndex].name} Logo 上传成功`)
  }
  reader.readAsDataURL(file)
  return false
}

// ================== ECharts 图表 ==================
function renderChart() {
  if (!chartRef.value) return
  // 容器尺寸为 0 时（路由过渡中），延迟重试
  if (chartRef.value.offsetWidth === 0 || chartRef.value.offsetHeight === 0) {
    if (updateTimer) clearTimeout(updateTimer)
    updateTimer = setTimeout(() => renderChart(), 150)
    return
  }
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const periodLabels = periods.value.map((period, index) => uiTexts['thYear_' + index] || period)
  const periodCount = Math.max(periodLabels.length, 1)
  const groupSize = periodCount + 1
  const xLabels: string[] = []
  const brandLabels: string[] = []
  const revenueData: Array<number | null> = []
  const percentageData: Array<number | null> = []

  const displayBrands = visibleBrands.value
  displayBrands.forEach((brand) => {
    periodLabels.forEach((period, periodIndex) => {
      xLabels.push(period)
      brandLabels.push(brand.name)
      revenueData.push(Number(brand.filterRev?.[periodIndex] || 0))
      percentageData.push(Number(brand.filterPct?.[periodIndex] || 0))
    })
    // 空分类切断不同品牌之间的占比折线，同时让品牌分组更清晰。
    xLabels.push('')
    brandLabels.push('')
    revenueData.push(null)
    percentageData.push(null)
  })

  const seriesData: any[] = [
    {
      name: uiTexts.chartLegendSales || '滤芯销售额',
      type: 'bar',
      xAxisIndex: 1,
      data: revenueData,
      barWidth: '58%',
      barCategoryGap: '24%',
      itemStyle: {
        color: (params: any) => {
          const brand = displayBrands[Math.floor(params.dataIndex / groupSize)]
          return isIQAirBrand(brand?.name) ? '#D32F2F' : (brand?.color || '#64748B')
        },
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: { focus: 'series' }
    },
    {
      name: uiTexts.chartLegendPct || '滤芯占比',
      type: 'line',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: percentageData,
      smooth: false,
      connectNulls: false,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: '#2563EB', borderColor: '#fff', borderWidth: 2 },
      lineStyle: { color: '#2563EB', width: 3 },
      emphasis: { focus: 'series', lineStyle: { width: 4 } }
    }
  ]

  const option: any = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      padding: 12,
      extraCssText: 'backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
      formatter: function (params: any) {
        const pointList = (Array.isArray(params) ? params : [params]).filter((point: any) => point?.dataIndex !== undefined)
        const dataIndex = pointList[0]?.dataIndex
        const brandIndex = Math.floor(dataIndex / groupSize)
        const periodIndex = dataIndex % groupSize
        const brandObj = displayBrands[brandIndex]
        if (periodIndex >= periodCount || !brandObj) return ''
        const finalLogo = brandObj.logo || (isIQAirBrand(brandObj.name) ? defaultIQAirLogo : '')
        const logoHtml = finalLogo
          ? `<img src="${finalLogo}" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;border-radius:2px;" />`
          : ''

        const period = periodLabels[periodIndex]
        return `<div style="font-weight:bold; margin-bottom:8px; color:${isIQAirBrand(brandObj.name) ? '#D32F2F' : brandObj.color}; font-size:13px; display:flex; align-items:center;">
          ${logoHtml} ${brandObj.name}
        </div>
        <div style="display:flex; justify-content:space-between; gap:20px; margin-bottom:4px;">
          <span style="color:#64748b;">${period} 销售额:</span>
          <span style="font-weight:600;">${formatNum(brandObj.filterRev[periodIndex] || 0)} 元</span>
        </div>
        <div style="display:flex; justify-content:space-between; gap:20px;">
          <span style="color:#64748b;">滤芯占比:</span>
          <span style="font-weight:600;">${brandObj.filterPct[periodIndex] || 0} %</span>
        </div>`
      }
    },
    legend: {
      data: [
        {
          name: uiTexts.chartLegendSales || '滤芯销售额',
          itemStyle: { color: '#64748B' }
        },
        {
          name: uiTexts.chartLegendPct || '滤芯占比',
          itemStyle: { color: '#2563EB' }
        }
      ],
      top: 0,
      icon: 'circle',
      textStyle: { color: '#86868B', fontSize: 12 },
      itemGap: 20
    },
    grid: { left: '2%', right: '2%', bottom: '8%', top: '18%', containLabel: true },
    xAxis: [
      {
        type: 'category',
        position: 'top',
        name: uiTexts.xAxisBrand || '品牌',
        nameLocation: 'middle',
        nameGap: 30,
        data: brandLabels,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#1C1C1E',
          fontSize: 12,
          fontWeight: 'bold',
          interval: 0,
          formatter: (_value: string, index: number) => index % groupSize === Math.floor(periodCount / 2)
            ? displayBrands[Math.floor(index / groupSize)]?.name || ''
            : ''
        }
      },
      {
        type: 'category',
        position: 'bottom',
        name: uiTexts.xAxisTime || '时间',
        nameLocation: 'middle',
        nameGap: 28,
        data: xLabels,
        axisLine: { lineStyle: { color: '#D2D2D7' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748B', fontSize: 11, interval: 0 }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: uiTexts.yAxisSales || '销售额 (元)',
        splitLine: { lineStyle: { color: '#F5F5F7', type: 'dashed' } },
        axisLabel: { color: '#86868B', fontSize: 11, formatter: (val: number) => val.toLocaleString('zh-CN') }
      },
      {
        type: 'value',
        name: uiTexts.yAxisPct || '滤芯占比 (%)',
        splitLine: { show: false },
        axisLabel: { color: '#86868B', fontSize: 11, formatter: '{value}%' }
      }
    ],
    series: seriesData
  }

  chartInstance.setOption(option, true)
}

// ================== 快照管理 ==================
function openSnapshotDialog() {
  snapshotNote.value = ''
  snapshotDialogVisible.value = true
}

async function handleCreateSnapshot() {
  snapshotting.value = true
  try {
    await dashboardApi.createSnapshot(PROJECT_ID, { note: snapshotNote.value })
    ElMessage.success('快照保存成功')
    snapshotDialogVisible.value = false
    fetchSnapshots()
  } catch {
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
    await dashboardApi.restoreSnapshot(PROJECT_ID, snapshotId)
    ElMessage.success('恢复成功')
    showHistoryDialog.value = false
    fetchData()
    fetchSnapshots()
  } catch {
    // 用户取消或错误
  }
}

// ================== 生命周期 ==================
function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  fetchData()
  fetchSnapshots()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  if (updateTimer) clearTimeout(updateTimer)
})

watch(showHistoryDialog, (val) => {
  if (val) fetchSnapshots()
})
</script>

<style scoped lang="scss">
.iqair-competitor {
  display: flex;
  height: 100%;
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
  overflow: hidden;
}

.sidebar-header {
  padding: 24px 20px 16px;
  border-bottom: 1px solid #F5F5F7;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0;
  outline: none;
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

.chart-label-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #64748B;
  font-size: 12px;
}

.chart-label-value {
  min-width: 92px;
  color: #1C1C1E;
  text-align: right;
}

.edit-toggle-btn {
  width: 100%;
  margin-bottom: 10px;
}

.action-btn {
  width: 100%;
  margin-bottom: 8px;
  justify-content: flex-start;
}

.mode-indicator {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 4px;
  margin-top: 4px;

  &.mode-view {
    background: #E0F2FE;
    color: #0369A1;
  }

  &.mode-edit {
    background: #FEF3C7;
    color: #B45309;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
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
  border: 1px solid transparent;
  font-size: 13px;
  transition: all 0.2s ease;

  &.is-iqair {
    border-color: #D32F2F;
    background: #FFFCFC;
  }
}

.brand-name {
  font-weight: 500;
}

.brand-check {
  min-width: 0;
  flex: 1;
}

.brand-check :deep(.el-checkbox__label) {
  overflow: hidden;
  text-overflow: ellipsis;
}

// 主展板区
.main-workspace {
  flex: 1;
  padding: 20px 28px;
  display: flex;
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
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.header-section {
  flex-shrink: 0;
}

.main-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0 0 4px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.main-sub {
  font-size: 0.7em;
  font-weight: normal;
  color: #86868B;
}

.main-desc {
  font-size: 0.8rem;
  color: #86868B;
  margin: 0;
}

.editable-text {
  outline: none;
  border-radius: 4px;
  padding: 2px 4px;
  transition: background 0.2s;

  &:focus {
    background: rgba(0, 122, 255, 0.08);
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
  }
}

.brand-name-cell {
  display: inline-block;
}

.chart-container {
  width: 100%;
  flex: 1;
  min-height: 0;
  user-select: none;
}

// 数据表
.table-section {
  width: 100%;
  flex-shrink: 0;
  overflow-x: auto;
}

.note-bar {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-shrink: 0;
  min-height: 34px;
  padding: 8px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.82);
  color: #64748B;
  font-size: 12px;
  line-height: 1.5;
}

.note-label {
  flex-shrink: 0;
  font-weight: 700;
  color: #475569;
}

.note-content {
  flex: 1;
  min-height: 18px;
  color: #64748B;
  white-space: pre-wrap;
  word-break: break-word;
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
  word-break: keep-all;
  line-height: 1.4;
}

.data-table th .editable-text {
  display: inline-block;
  min-width: 20px;
  max-width: 100%;
  word-break: keep-all;
  line-height: 1.4;
  cursor: text;
}

.data-table th .editable-text[contenteditable="true"] {
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px dashed #94A3B8;
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
