<template>
  <div class="data-dashboard">
    <!-- 左侧工具栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3 class="sidebar-title">数据控制台</h3>
        <p class="sidebar-sub">天猫生意参谋 · 京东商智</p>
      </div>

      <div class="sidebar-content">
        <!-- 数据上传 -->
        <div class="sidebar-section">
          <div class="section-title">数据上传</div>
          <p class="section-desc">支持每日 / 每周 / 每月数据更新，Excel 上传后自动解析并刷新看板。</p>
          <el-upload
            :show-file-list="false"
            :before-upload="handleUpload"
            accept=".xlsx,.xls"
            drag
            class="upload-area"
          >
            <el-icon size="32" color="#007AFF"><UploadFilled /></el-icon>
            <div class="upload-text">点击或拖拽上传</div>
            <div class="upload-hint">.xlsx / .xls 格式</div>
          </el-upload>
          <el-button class="action-btn" @click="downloadTemplate">
            <el-icon><Download /></el-icon> 下载导入模板
          </el-button>
          <div v-if="uploadResult" class="upload-result" :class="{ 'is-error': uploadError }">
            <el-icon><CircleCheckFilled v-if="!uploadError" /><WarningFilled v-else /></el-icon>
            <span>{{ uploadResult }}</span>
          </div>
        </div>

        <!-- 时间维度筛选 -->
        <div class="sidebar-section">
          <div class="section-title">时间维度</div>
          <el-radio-group v-model="periodType" class="period-group" @change="onFilterChange">
            <el-radio-button value="daily">按日</el-radio-button>
            <el-radio-button value="weekly">按周</el-radio-button>
            <el-radio-button value="monthly">按月</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 自定义时间范围 -->
        <div class="sidebar-section">
          <div class="section-title">自定义时间范围</div>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="default"
            class="date-picker"
            :clearable="true"
            @change="onFilterChange"
          />
          <el-button class="action-btn" size="small" @click="resetDateRange">
            <el-icon><RefreshLeft /></el-icon> 重置时间范围
          </el-button>
        </div>

        <!-- 数据概览 -->
        <div class="sidebar-section" v-if="hasData">
          <div class="section-title">数据概览</div>
          <div class="overview-item" v-for="item in overviewStats" :key="item.platform">
            <div class="overview-platform">
              <span class="platform-dot" :style="{ background: item.color }"></span>
              {{ item.platform }}
            </div>
            <div class="overview-sales">¥ {{ formatNum(item.totalSales) }}</div>
            <div class="overview-yoy" :class="item.yoyGrowth >= 0 ? 'pos' : 'neg'" v-if="item.yoyGrowth !== null">
              同比 {{ item.yoyGrowth >= 0 ? '+' : '' }}{{ item.yoyGrowth }}%
            </div>
            <div class="overview-yoy" v-else>同比 —</div>
          </div>
        </div>

        <!-- 操作提示 -->
        <div class="sidebar-section">
          <div class="section-title">操作提示</div>
          <ul class="tips-list">
            <li>上传后看板自动刷新</li>
            <li>表格支持点击表头排序</li>
            <li>图表支持滚轮缩放与悬停详情</li>
            <li>切换时间维度即时联动</li>
          </ul>
        </div>
      </div>
    </aside>

    <!-- 主展板区 -->
    <main class="main-workspace">
      <div class="platforms-container">
        <!-- 天猫数据模块 -->
        <section class="platform-module" v-loading="loading.tmall">
          <div class="module-header">
            <div class="module-title-area">
              <span class="platform-badge tmall">天猫</span>
              <h2 class="module-title">生意参谋数据</h2>
            </div>
            <div class="module-actions">
              <el-button size="small" plain @click="exportTable('tmall')">
                <el-icon><Download /></el-icon> 导出
              </el-button>
              <el-button size="small" plain @click="refreshPlatform('tmall')">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 汇总卡片 -->
          <div class="summary-cards" v-if="tmallSummary">
            <div class="summary-card">
              <div class="summary-label">总销售额</div>
              <div class="summary-value">¥ {{ formatNum(tmallSummary.total_sales) }}</div>
              <div class="summary-yoy" :class="tmallSummary.yoy_growth >= 0 ? 'pos' : 'neg'" v-if="tmallSummary.yoy_growth !== null">
                同比 {{ tmallSummary.yoy_growth >= 0 ? '+' : '' }}{{ tmallSummary.yoy_growth }}%
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">总订单</div>
              <div class="summary-value">{{ formatNum(tmallSummary.total_orders) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">总访客</div>
              <div class="summary-value">{{ formatNum(tmallSummary.total_visitors) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">平均转化率</div>
              <div class="summary-value">{{ tmallSummary.avg_conversion }}%</div>
            </div>
          </div>

          <!-- 数据表格 -->
          <div class="table-wrapper">
            <el-table
              :data="(tmallData?.records || [])"
              size="small"
              border
              stripe
              :max-height="240"
              @sort-change="(e: any) => onSortChange(e, 'tmall')"
            >
              <el-table-column prop="label" label="期间" min-width="110" sortable="custom" fixed />
              <el-table-column prop="sales_amount" label="销售额(元)" min-width="120" sortable="custom" align="right">
                <template #default="{ row }">
                  <span class="num-cell">{{ formatNum(row.sales_amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="yoy_sales_amount" label="去年同期" min-width="120" align="right">
                <template #default="{ row }">
                  <span v-if="row.yoy_sales_amount !== null" class="num-cell muted">{{ formatNum(row.yoy_sales_amount) }}</span>
                  <span v-else class="muted">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="yoy_growth" label="同比" min-width="90" sortable="custom" align="right">
                <template #default="{ row }">
                  <el-tag v-if="row.yoy_growth !== null" :type="row.yoy_growth >= 0 ? 'success' : 'danger'" size="small" effect="plain">
                    {{ row.yoy_growth >= 0 ? '+' : '' }}{{ row.yoy_growth }}%
                  </el-tag>
                  <span v-else class="muted">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="order_count" label="订单数" min-width="90" sortable="custom" align="right">
                <template #default="{ row }"><span class="num-cell">{{ formatNum(row.order_count) }}</span></template>
              </el-table-column>
              <el-table-column prop="visitor_count" label="访客数" min-width="90" sortable="custom" align="right">
                <template #default="{ row }"><span class="num-cell">{{ formatNum(row.visitor_count) }}</span></template>
              </el-table-column>
              <el-table-column prop="conversion_rate" label="转化率" min-width="80" sortable="custom" align="right">
                <template #default="{ row }">{{ row.conversion_rate }}%</template>
              </el-table-column>
              <el-table-column prop="unit_price" label="客单价" min-width="90" sortable="custom" align="right">
                <template #default="{ row }"><span class="num-cell">¥{{ formatNum(row.unit_price) }}</span></template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无天猫数据，请上传 Excel" :image-size="60" />
              </template>
            </el-table>
          </div>

          <!-- 折线图 -->
          <div ref="tmallChartRef" class="chart-container"></div>
        </section>

        <!-- 京东数据模块 -->
        <section class="platform-module" v-loading="loading.jd">
          <div class="module-header">
            <div class="module-title-area">
              <span class="platform-badge jd">京东</span>
              <h2 class="module-title">京东商智品牌纵横</h2>
            </div>
            <div class="module-actions">
              <el-button size="small" plain @click="exportTable('jd')">
                <el-icon><Download /></el-icon> 导出
              </el-button>
              <el-button size="small" plain @click="refreshPlatform('jd')">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 汇总卡片 -->
          <div class="summary-cards" v-if="jdSummary">
            <div class="summary-card">
              <div class="summary-label">总销售额</div>
              <div class="summary-value">¥ {{ formatNum(jdSummary.total_sales) }}</div>
              <div class="summary-yoy" :class="jdSummary.yoy_growth >= 0 ? 'pos' : 'neg'" v-if="jdSummary.yoy_growth !== null">
                同比 {{ jdSummary.yoy_growth >= 0 ? '+' : '' }}{{ jdSummary.yoy_growth }}%
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">总订单</div>
              <div class="summary-value">{{ formatNum(jdSummary.total_orders) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">总访客</div>
              <div class="summary-value">{{ formatNum(jdSummary.total_visitors) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">平均转化率</div>
              <div class="summary-value">{{ jdSummary.avg_conversion }}%</div>
            </div>
          </div>

          <!-- 数据表格 -->
          <div class="table-wrapper">
            <el-table
              :data="(jdData?.records || [])"
              size="small"
              border
              stripe
              :max-height="240"
              @sort-change="(e: any) => onSortChange(e, 'jd')"
            >
              <el-table-column prop="label" label="期间" min-width="110" sortable="custom" fixed />
              <el-table-column prop="sales_amount" label="销售额(元)" min-width="120" sortable="custom" align="right">
                <template #default="{ row }">
                  <span class="num-cell">{{ formatNum(row.sales_amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="yoy_sales_amount" label="去年同期" min-width="120" align="right">
                <template #default="{ row }">
                  <span v-if="row.yoy_sales_amount !== null" class="num-cell muted">{{ formatNum(row.yoy_sales_amount) }}</span>
                  <span v-else class="muted">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="yoy_growth" label="同比" min-width="90" sortable="custom" align="right">
                <template #default="{ row }">
                  <el-tag v-if="row.yoy_growth !== null" :type="row.yoy_growth >= 0 ? 'success' : 'danger'" size="small" effect="plain">
                    {{ row.yoy_growth >= 0 ? '+' : '' }}{{ row.yoy_growth }}%
                  </el-tag>
                  <span v-else class="muted">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="order_count" label="订单数" min-width="90" sortable="custom" align="right">
                <template #default="{ row }"><span class="num-cell">{{ formatNum(row.order_count) }}</span></template>
              </el-table-column>
              <el-table-column prop="visitor_count" label="访客数" min-width="90" sortable="custom" align="right">
                <template #default="{ row }"><span class="num-cell">{{ formatNum(row.visitor_count) }}</span></template>
              </el-table-column>
              <el-table-column prop="conversion_rate" label="转化率" min-width="80" sortable="custom" align="right">
                <template #default="{ row }">{{ row.conversion_rate }}%</template>
              </el-table-column>
              <el-table-column prop="unit_price" label="客单价" min-width="90" sortable="custom" align="right">
                <template #default="{ row }"><span class="num-cell">¥{{ formatNum(row.unit_price) }}</span></template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无京东数据，请上传 Excel" :image-size="60" />
              </template>
            </el-table>
          </div>

          <!-- 折线图 -->
          <div ref="jdChartRef" class="chart-container"></div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UploadFilled, Download, Refresh, RefreshLeft,
  CircleCheckFilled, WarningFilled
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { platformApi } from '@/api/dashboard'
import type {
  PlatformDataResponse, PlatformSummary, PlatformRecord
} from '@/api/dashboard'

type PlatformKey = 'tmall' | 'jd'

const periodType = ref<'daily' | 'weekly' | 'monthly'>('daily')
const dateRange = ref<[string, string] | null>(null)

const tmallData = ref<PlatformDataResponse | null>(null)
const jdData = ref<PlatformDataResponse | null>(null)
const loading = reactive({ tmall: false, jd: false })

const uploadResult = ref('')
const uploadError = ref(false)

const tmallChartRef = ref<HTMLElement>()
const jdChartRef = ref<HTMLElement>()
let tmallChart: echarts.ECharts | null = null
let jdChart: echarts.ECharts | null = null
let renderTimer: ReturnType<typeof setTimeout> | null = null

// 表格排序状态
const sortState = reactive<Record<PlatformKey, { prop: string; order: string }>>({
  tmall: { prop: 'label', order: 'ascending' },
  jd: { prop: 'label', order: 'ascending' }
})

const hasData = computed(() =>
  !!(tmallData.value?.records?.length || jdData.value?.records?.length)
)

const tmallSummary = computed(() => {
  if (!tmallData.value?.summary || !Object.keys(tmallData.value.summary).length) {
    return null
  }
  return tmallData.value.summary as PlatformSummary
})

const jdSummary = computed(() => {
  if (!jdData.value?.summary || !Object.keys(jdData.value.summary).length) {
    return null
  }
  return jdData.value.summary as PlatformSummary
})

const overviewStats = computed(() => {
  const stats: { platform: string; color: string; totalSales: number; yoyGrowth: number | null }[] = []
  if (tmallData.value?.summary && Object.keys(tmallData.value.summary).length) {
    const s = tmallData.value.summary as PlatformSummary
    stats.push({ platform: '天猫', color: '#FF0036', totalSales: s.total_sales, yoyGrowth: s.yoy_growth })
  }
  if (jdData.value?.summary && Object.keys(jdData.value.summary).length) {
    const s = jdData.value.summary as PlatformSummary
    stats.push({ platform: '京东', color: '#E1251B', totalSales: s.total_sales, yoyGrowth: s.yoy_growth })
  }
  return stats
})

function formatNum(num: number) {
  return Math.round(num).toLocaleString('zh-CN')
}

// ================== 数据加载 ==================
async function loadPlatformData(platform: PlatformKey) {
  loading[platform] = true
  try {
    const params: any = { platform, period_type: periodType.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const data = await platformApi.queryData(params)
    if (platform === 'tmall') {
      tmallData.value = data
    } else {
      jdData.value = data
    }
    await nextTick()
    renderChart(platform)
  } catch {
    // 错误已由拦截器处理
  } finally {
    loading[platform] = false
  }
}

async function loadAll() {
  await Promise.all([loadPlatformData('tmall'), loadPlatformData('jd')])
}

function onFilterChange() {
  loadAll()
}

function resetDateRange() {
  dateRange.value = null
  loadAll()
}

function refreshPlatform(platform: PlatformKey) {
  loadPlatformData(platform)
}

// ================== 上传 ==================
async function handleUpload(file: File) {
  loading.tmall = true
  loading.jd = true
  try {
    const res: any = await platformApi.uploadExcel(file)
    uploadResult.value = res.detail || '上传成功'
    uploadError.value = false
    ElMessage.success(uploadResult.value)
    await loadAll()
  } catch (error: any) {
    uploadResult.value = error.response?.data?.detail || '上传失败'
    uploadError.value = true
  } finally {
    loading.tmall = false
    loading.jd = false
  }
  return false
}

async function downloadTemplate() {
  try {
    const res: any = await platformApi.downloadTemplate()
    const blob = new Blob([res], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'platform_data_template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch {
    ElMessage.error('模板下载失败')
  }
}

// ================== 表格排序 ==================
function onSortChange({ prop, order }: { prop: string; order: string | null }, platform: PlatformKey) {
  sortState[platform] = { prop: prop || 'label', order: order || 'ascending' }
  const data = platform === 'tmall' ? tmallData.value : jdData.value
  if (!data?.records) return
  if (!order) {
    data.records.sort((a, b) => (a.date < b.date ? -1 : 1))
  } else {
    data.records.sort((a, b) => {
      const va = (a as any)[prop]
      const vb = (b as any)[prop]
      if (va === null) return 1
      if (vb === null) return -1
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb
      return order === 'ascending' ? cmp : -cmp
    })
  }
  renderChart(platform)
}

// ================== 导出 ==================
function exportTable(platform: PlatformKey) {
  const data = platform === 'tmall' ? tmallData.value : jdData.value
  if (!data?.records?.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const headers = ['期间', '销售额', '去年同期销售额', '同比(%)', '订单数', '访客数', '转化率(%)', '客单价']
  const rows = data.records.map(r => [
    r.label, r.sales_amount, r.yoy_sales_amount ?? '',
    r.yoy_growth ?? '', r.order_count, r.visitor_count,
    r.conversion_rate, r.unit_price
  ])
  const csv = [headers, ...rows].map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${platform}_data_${periodType.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// ================== ECharts ==================
function renderChart(platform: PlatformKey) {
  const data = platform === 'tmall' ? tmallData.value : jdData.value
  const chartRef = platform === 'tmall' ? tmallChartRef.value : jdChartRef.value
  if (!chartRef) return

  if (chartRef.offsetWidth === 0 || chartRef.offsetHeight === 0) {
    if (renderTimer) clearTimeout(renderTimer)
    renderTimer = setTimeout(() => renderChart(platform), 150)
    return
  }

  let chart = platform === 'tmall' ? tmallChart : jdChart
  if (!chart) {
    chart = echarts.init(chartRef)
    if (platform === 'tmall') {
      tmallChart = chart
    } else {
      jdChart = chart
    }
  }

  if (!data?.records?.length) {
    chart.clear()
    return
  }

  const labels = data.records.map(r => r.label)
  const primaryColor = platform === 'tmall' ? '#FF0036' : '#E1251B'
  const secondaryColor = platform === 'tmall' ? '#FF6B8A' : '#F5A0A0'

  const salesData = data.records.map(r => r.sales_amount)
  const yoySalesData = data.records.map(r => r.yoy_sales_amount)
  const orderData = data.records.map(r => r.order_count)
  const visitorData = data.records.map(r => r.visitor_count)

  const option: any = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      padding: 12,
      extraCssText: 'backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
      formatter: (params: any[]) => {
        const idx = params[0].dataIndex
        const rec = data.records[idx]
        let html = `<div style="font-weight:700; margin-bottom:8px; color:#1C1C1E; font-size:13px;">${rec.label}</div>`
        html += `<div style="display:flex; justify-content:space-between; min-width:200px; margin-bottom:4px;">
          <span style="color:#64748b;">销售额:</span>
          <span style="font-weight:600; color:${primaryColor};">¥ ${formatNum(rec.sales_amount)}</span>
        </div>`
        if (rec.yoy_sales_amount !== null) {
          const growthColor = (rec.yoy_growth ?? 0) >= 0 ? '#10B981' : '#EF4444'
          html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#64748b;">去年同期:</span>
            <span style="font-weight:600;">¥ ${formatNum(rec.yoy_sales_amount)}</span>
          </div>`
          html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#64748b;">同比:</span>
            <span style="font-weight:600; color:${growthColor};">${(rec.yoy_growth ?? 0) >= 0 ? '+' : ''}${rec.yoy_growth}%</span>
          </div>`
        }
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="color:#64748b;">订单数:</span><span style="font-weight:600;">${formatNum(rec.order_count)}</span>
        </div>`
        html += `<div style="display:flex; justify-content:space-between;">
          <span style="color:#64748b;">访客数:</span><span style="font-weight:600;">${formatNum(rec.visitor_count)}</span>
        </div>`
        return html
      }
    },
    legend: {
      data: ['销售额', '去年同期', '订单数', '访客数'],
      top: 0,
      icon: 'circle',
      textStyle: { color: '#86868B', fontSize: 11 },
      itemGap: 16
    },
    grid: { left: '2%', right: '2%', bottom: '8%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#D2D2D7' } },
      axisTick: { show: false },
      axisLabel: { color: '#1C1C1E', fontSize: 11, rotate: labels.length > 10 ? 35 : 0 }
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额(元)',
        splitLine: { lineStyle: { color: '#F5F5F7', type: 'dashed' } },
        axisLabel: { color: '#86868B', fontSize: 10, formatter: (val: number) => val >= 10000 ? (val / 10000).toFixed(1) + '万' : val }
      },
      {
        type: 'value',
        name: '订单/访客',
        splitLine: { show: false },
        axisLabel: { color: '#86868B', fontSize: 10 }
      }
    ],
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 16, bottom: 4, borderColor: 'transparent', fillerColor: 'rgba(0,122,255,0.1)' }
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        data: salesData,
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: primaryColor },
        itemStyle: { color: primaryColor, borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: primaryColor + '33' },
            { offset: 1, color: primaryColor + '05' }
          ])
        },
        emphasis: { focus: 'series' }
      },
      {
        name: '去年同期',
        type: 'line',
        data: yoySalesData,
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: secondaryColor, type: 'dashed' },
        itemStyle: { color: secondaryColor },
        emphasis: { focus: 'series' }
      },
      {
        name: '订单数',
        type: 'line',
        data: orderData,
        yAxisIndex: 1,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 5,
        lineStyle: { width: 2, color: '#10B981' },
        itemStyle: { color: '#10B981' },
        emphasis: { focus: 'series' }
      },
      {
        name: '访客数',
        type: 'line',
        data: visitorData,
        yAxisIndex: 1,
        smooth: true,
        symbol: 'triangle',
        symbolSize: 5,
        lineStyle: { width: 2, color: '#0EA5E9' },
        itemStyle: { color: '#0EA5E9' },
        emphasis: { focus: 'series' }
      }
    ]
  }

  chart.setOption(option, true)
}

function handleResize() {
  tmallChart?.resize()
  jdChart?.resize()
}

// ================== 生命周期 ==================
onMounted(() => {
  loadAll()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  tmallChart?.dispose()
  jdChart?.dispose()
  if (renderTimer) clearTimeout(renderTimer)
})

// 监听数据变化重绘图表
watch([tmallData, jdData], () => {
  nextTick(() => {
    renderChart('tmall')
    renderChart('jd')
  })
})
</script>

<style scoped lang="scss">
.data-dashboard {
  display: flex;
  height: 100%;
  overflow: hidden;
}

// 侧边栏
.sidebar {
  width: 300px;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
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

// 上传区域
.upload-area {
  width: 100%;
  margin-bottom: 10px;

  :deep(.el-upload-dragger) {
    padding: 20px 10px;
    border-radius: 12px;
    background: rgba(0, 122, 255, 0.03);
    border: 1px dashed rgba(0, 122, 255, 0.3);
    transition: all 0.2s ease;

    &:hover {
      border-color: #007AFF;
      background: rgba(0, 122, 255, 0.06);
    }
  }
}

.upload-text {
  font-size: 13px;
  font-weight: 600;
  color: #1C1C1E;
  margin-top: 8px;
}

.upload-hint {
  font-size: 11px;
  color: #86868B;
  margin-top: 4px;
}

.action-btn {
  width: 100%;
  margin-bottom: 8px;
  justify-content: flex-start;
}

.upload-result {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #10B981;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: 8px;

  &.is-error {
    color: #EF4444;
    background: rgba(239, 68, 68, 0.08);
  }
}

// 时间维度
.period-group {
  width: 100%;

  :deep(.el-radio-button) {
    width: calc(100% / 3);

    .el-radio-button__inner {
      width: 100%;
    }
  }
}

.date-picker {
  width: 100%;
  margin-bottom: 10px;
}

// 数据概览
.overview-item {
  padding: 10px 12px;
  background: #F5F5F7;
  border-radius: 8px;
  margin-bottom: 8px;
}

.overview-platform {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #1C1C1E;
}

.platform-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.overview-sales {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  margin-top: 4px;
}

.overview-yoy {
  font-size: 11px;
  font-weight: 600;

  &.pos { color: #10B981; }
  &.neg { color: #EF4444; }
}

// 提示列表
.tips-list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #86868B;
  line-height: 1.8;
}

// 主展板区
.main-workspace {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

.platforms-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.platform-module {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  min-height: 380px;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.module-title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.platform-badge {
  font-size: 12px;
  font-weight: 700;
  color: white;
  padding: 3px 10px;
  border-radius: 6px;

  &.tmall { background: #FF0036; }
  &.jd { background: #E1251B; }
}

.module-title {
  font-size: 16px;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0;
}

.module-actions {
  display: flex;
  gap: 8px;
}

// 汇总卡片
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  flex-shrink: 0;
}

.summary-card {
  background: rgba(245, 245, 247, 0.6);
  border-radius: 10px;
  padding: 12px 14px;
}

.summary-label {
  font-size: 11px;
  color: #86868B;
  font-weight: 600;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
}

.summary-yoy {
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;

  &.pos { color: #10B981; }
  &.neg { color: #EF4444; }
}

// 表格
.table-wrapper {
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-table th) {
    background: rgba(234, 242, 253, 0.85);
    font-weight: 600;
    color: #1C1C1E;
  }
}

.num-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.muted {
  color: #AEAEB2;
}

// 图表
.chart-container {
  width: 100%;
  flex: 1;
  min-height: 180px;
  user-select: none;
}

// 响应式
@media (max-width: 1280px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .data-dashboard {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 280px;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .platforms-container {
    gap: 12px;
  }

  .platform-module {
    min-height: 320px;
  }
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .module-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
