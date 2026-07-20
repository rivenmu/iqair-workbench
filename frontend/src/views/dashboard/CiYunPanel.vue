<template>
  <div class="ciyun-page" :class="{ 'dark-mode': isDarkScheme }" :style="{ background: schemeBackground }">
    <!-- 左侧边栏 -->
    <aside class="ciyun-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>
            <circle cx="12" cy="6" r="2"/><circle cx="12" cy="18" r="2"/>
            <circle cx="18" cy="6" r="1"/><circle cx="6" cy="18" r="1"/><circle cx="18" cy="18" r="1"/><circle cx="6" cy="6" r="1"/>
          </svg>
        </div>
        <h1 class="sidebar-title">词云分析</h1>
        <p class="sidebar-subtitle">产品售后关键词</p>
      </div>

      <div class="sidebar-section">
        <span class="section-label">语言</span>
        <div class="lang-menu">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['lang-item', { active: activeTab === tab.key }]"
            @click="switchTab(tab.key)"
          >
            <span class="lang-dot"></span>
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="sidebar-section">
        <span class="section-label">配色方案</span>
        <div class="scheme-group">
          <button
            v-for="(label, key) in schemeLabels"
            :key="key"
            :class="['scheme-item', { active: activeScheme === key }]"
            @click="selectScheme(key)"
          >
            <span class="scheme-dot" :class="key"></span>
            <span class="scheme-name">{{ label }}</span>
          </button>
        </div>
      </div>

      <div class="sidebar-section keyword-section">
        <div class="section-header">
          <span class="section-label">关键词编辑</span>
          <div class="section-actions">
            <button class="action-btn save-btn" @click="saveWords" :disabled="!hasChanges" title="保存修改">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              保存
            </button>
            <button class="action-btn refresh-btn" @click="refreshChart" title="刷新词云">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="keyword-list">
          <div v-for="weight in [100, 80, 70, 60, 50, 40]" :key="weight" class="keyword-group">
            <button class="group-header" @click="toggleGroup(weight)">
              <span class="group-swatch" :style="{ background: colorMap[weight] }"></span>
              <span class="group-label">{{ weight }}分</span>
              <span class="group-count">{{ getWordsByWeight(weight).length }}</span>
              <span class="group-arrow" :class="{ expanded: expandedGroups.includes(weight) }">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </button>
            <div v-show="expandedGroups.includes(weight)" class="group-items">
              <div v-for="(word, idx) in getWordsByWeight(weight)" :key="idx" class="keyword-item">
                <input
                  class="keyword-input cn-input"
                  v-model="word.cn"
                  placeholder="中文"
                  @input="onWordChange"
                />
                <input
                  class="keyword-input en-input"
                  v-model="word.en"
                  placeholder="English"
                  @input="onWordChange"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="color-legend">
          <span class="section-label">权重图例</span>
          <div class="legend-list">
            <div v-for="weight in [100, 80, 70, 60, 50, 40]" :key="weight" class="legend-item">
              <span class="legend-swatch" :style="{ background: colorMap[weight] }"></span>
              <span class="legend-label">{{ weight }}分</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="ciyun-main">
      <div class="dashboard-card">
        <div ref="chartRef" class="ciyun-chart"></div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

declare const echarts: any

interface WordItem {
  cn: string
  en: string
  value: number
}

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: any = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const tabs = [
  { key: 'bilingual', label: '中英双语' },
  { key: 'cn', label: '中文' },
  { key: 'en', label: 'English' },
]
const activeTab = ref('bilingual')

type SchemeKey = 'natural' | 'vivid' | 'bright' | 'vintage' | 'morandi'

interface ColorScheme {
  colors: Record<number, string>
  background: string
  isDark: boolean
}

const colorSchemes: Record<SchemeKey, ColorScheme> = {
  natural: {
    colors: {
      100: '#6B2117',
      80:  '#930A7B',
      70:  '#3F6E86',
      60:  '#188863',
      50:  '#567F18',
      40:  '#9D984F',
    },
    background: '#FFFFFF',
    isDark: false,
  },
  vivid: {
    colors: {
      100: '#8B2E2E',
      80:  '#6B8E23',
      70:  '#9932CC',
      60:  '#1E90FF',
      50:  '#2E8B57',
      40:  '#333333',
    },
    background: '#FFFFFF',
    isDark: false,
  },
  bright: {
    colors: {
      100: '#8B2E2E',
      80:  '#6B8E23',
      70:  '#9932CC',
      60:  '#4A7C8C',
      50:  '#2E8B57',
      40:  '#333333',
    },
    background: '#FFFFFF',
    isDark: false,
  },
  vintage: {
    colors: {
      100: '#5D2E2E',
      80:  '#7B3F61',
      70:  '#1A4F4A',
      60:  '#5A6E2B',
      50:  '#5B6C7D',
      40:  '#B8863B',
    },
    background: '#FFFFFF',
    isDark: false,
  },
  morandi: {
    colors: {
      100: '#5A6B7D',
      80:  '#7B9B8B',
      70:  '#A78B9F',
      60:  '#C9A895',
      50:  '#9CAFB5',
      40:  '#D4C9B8',
    },
    background: '#FDFBF7',
    isDark: false,
  },
}

const schemeLabels: Record<SchemeKey, string> = {
  bright: '明亮色',
  morandi: '莫兰迪',
  natural: '自然色',
  vivid: '鲜明色',
  vintage: '复古色',
}

const activeScheme = ref<SchemeKey>('bright')
const currentScheme = computed(() => colorSchemes[activeScheme.value])
const colorMap = computed(() => currentScheme.value.colors)
const schemeBackground = computed(() => currentScheme.value.background)
const isDarkScheme = computed(() => currentScheme.value.isDark)

const expandedGroups = ref<number[]>([100])

const fontWeightMap: Record<number, number> = {
  100: 500,
  80:  400,
  70:  400,
  60:  400,
  50:  300,
  40:  300,
}

const STORAGE_KEY = 'ciyun_word_items'

const defaultWordItems: WordItem[] = [
  { cn: '噪音大',       en: 'Too Noisy',           value: 100 },
  { cn: '差评',         en: 'Bad Reviews',         value: 100 },
  { cn: '不推荐购买',   en: 'Not Recommended',     value: 100 },
  { cn: '价格贵',       en: 'Overpriced',          value: 80 },
  { cn: '吸毛效果差',   en: 'Poor Pet Hair Pickup', value: 70 },
  { cn: '效果不明显',   en: 'Barely Effective',    value: 80 },
  { cn: '异响',         en: 'Abnormal Noise',      value: 70 },
  { cn: '偏大',         en: 'Oversized',           value: 60 },
  { cn: '偏小',         en: 'Undersized',          value: 50 },
  { cn: '质量差',       en: 'Low Quality',         value: 60 },
  { cn: '效果差',       en: 'Poor Results',        value: 50 },
  { cn: '异味',         en: 'Bad Smell',           value: 60 },
  { cn: '过滤效果差',   en: 'Weak Filtration',     value: 50 },
  { cn: '耗电高',       en: 'Power Hungry',        value: 60 },
  { cn: '服务差',       en: 'Bad Service',         value: 50 },
  { cn: '声音大',       en: 'Too Loud',            value: 60 },
  { cn: '占用空间大',   en: 'Too Bulky',           value: 50 },
  { cn: '物流慢',       en: 'Slow Shipping',       value: 60 },
  { cn: '尺寸大',       en: 'Too Big',             value: 50 },
  { cn: '客服差',       en: 'Rude Support',        value: 60 },
  { cn: '价格不稳定',   en: 'Price Unstable',      value: 50 },
  { cn: '清洁不彻底',   en: 'Half Cleaned',        value: 60 },
  { cn: '去味效果差',   en: 'Lingering Odor',      value: 50 },
  { cn: '退货问题',     en: 'Return Hassle',       value: 60 },
  { cn: '风力弱',       en: 'Weak Wind',           value: 50 },
  { cn: '物流服务差',   en: 'Bad Logistics',       value: 60 },
  { cn: '功率小',       en: 'Low Wattage',         value: 50 },
  { cn: '覆盖范围小',   en: 'Short Reach',         value: 60 },
  { cn: '耗材贵',       en: 'Pricey Filters',      value: 50 },
  { cn: '态度差',       en: 'Rude Staff',          value: 60 },
  { cn: '性能下降',     en: 'Slowing Down',        value: 50 },
  { cn: '性价比低',     en: 'Poor Value',          value: 60 },
  { cn: '无保价',       en: 'No Price Match',      value: 50 },
  { cn: '不满意',       en: 'Disappointing',       value: 60 },
  { cn: '甲醛问题',     en: 'Formaldehyde Risk',   value: 50 },
  { cn: '外观一般',     en: 'Ugly Design',         value: 60 },
  { cn: '降价快',       en: 'Price Drops Fast',    value: 50 },
  { cn: '售后差',       en: 'Bad After-Sales',     value: 60 },
  { cn: '无遥控器',     en: 'No Remote',           value: 50 },
  { cn: '效果一般',     en: 'Just Okay',           value: 60 },
  { cn: '偏重',         en: 'Too Heavy',           value: 50 },
  { cn: '浪费',         en: 'A Waste',             value: 60 },
  { cn: '购物差评',     en: 'Regret Purchase',     value: 50 },
  { cn: '不退货',       en: 'No Returns',          value: 60 },
  { cn: '容量小',       en: 'Too Small',           value: 50 },
  { cn: '不完整',       en: 'Missing Parts',       value: 60 },
  { cn: '包装破损',     en: 'Damaged Box',         value: 50 },
  { cn: '不实用',       en: 'Useless',             value: 60 },
  { cn: '吸附效果差',   en: 'Weak Suction',        value: 50 },
  { cn: '滤芯贵',       en: 'Costly Filters',      value: 60 },
  { cn: '试用限制',     en: 'Trial Locked',        value: 50 },
  { cn: '不可退货',     en: 'Final Sale',          value: 60 },
  { cn: '吸尘效果一般', en: 'So-So Suction',       value: 50 },
  { cn: '不耐用',       en: 'Short-Lived',         value: 60 },
  { cn: '配送差',       en: 'Rough Delivery',      value: 50 },
  { cn: '去甲醛效果慢', en: 'Slow Purifying',      value: 60 },
  { cn: '尺寸偏高',     en: 'Too Tall',            value: 50 },
  { cn: '质感差',       en: 'Cheap Feel',          value: 60 },
  { cn: '烟味',         en: 'Smoky Smell',         value: 50 },
  { cn: '异味偏重',     en: 'Strong Stench',       value: 60 },
  { cn: '噪声',         en: 'Noisy',               value: 50 },
  { cn: '设计差',       en: 'Ugly',                value: 60 },
  { cn: '有声音',       en: 'Rattling',            value: 50 },
  { cn: '瑕疵',         en: 'Flawed',              value: 60 },
  { cn: '轻微',         en: 'Trivial',             value: 50 },
  { cn: '无除臭功能',   en: 'No Deodorizer',       value: 40 },
  { cn: '不吸猫毛',     en: 'Skips Cat Hair',      value: 40 },
  { cn: '回答不准确',   en: 'Wrong Answers',       value: 40 },
  { cn: '保修',         en: 'Warranty',            value: 40 },
  { cn: '防骗提醒',     en: 'Fraud Alert',         value: 40 },
  { cn: '不保价',       en: 'No Guarantee',        value: 40 },
  { cn: '不一致',       en: 'Inconsistent',        value: 40 },
  { cn: '不爽',         en: 'Annoying',            value: 40 },
  { cn: '滤网脏',       en: 'Grimy Filter',        value: 40 },
  { cn: '无用',         en: 'Pointless',           value: 40 },
  { cn: '一般',         en: 'Mediocre',            value: 40 },
  { cn: '价格偏贵',     en: 'A Bit Pricey',        value: 40 },
  { cn: '欺诈行为',     en: 'Scammy',              value: 40 },
  { cn: '有味',         en: 'Smelly',              value: 40 },
  { cn: '无法评价',     en: "Can't Judge",         value: 40 },
  { cn: '不方便',       en: 'Clunky',              value: 40 },
  { cn: '不好',         en: 'Bad',                 value: 40 },
  { cn: '不安全',       en: 'Unsafe',              value: 40 },
  { cn: '无轮子',       en: 'No Wheels',           value: 40 },
  { cn: '不舒服',       en: 'Uncomfy',             value: 40 },
  { cn: '恶劣体验',     en: 'Horrible',            value: 40 },
  { cn: '沟通问题',     en: 'Poor Comms',          value: 40 },
  { cn: '风机问题',     en: 'Fan Failure',         value: 40 },
  { cn: '假货',         en: 'Counterfeit',         value: 40 },
  { cn: '配送问题',     en: 'Ship Issues',         value: 40 },
  { cn: '恶臭',         en: 'Stinks',              value: 40 },
  { cn: '降价',         en: 'Markdown',            value: 40 },
]

function loadSavedWords(): WordItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load saved words:', e)
  }
  return JSON.parse(JSON.stringify(defaultWordItems))
}

const wordItems = ref<WordItem[]>(loadSavedWords())
const hasChanges = ref(false)
let savedSnapshot = JSON.stringify(wordItems.value)

function getWordsByWeight(weight: number) {
  return wordItems.value.filter((item) => item.value === weight)
}

function toggleGroup(weight: number) {
  const idx = expandedGroups.value.indexOf(weight)
  if (idx > -1) {
    expandedGroups.value.splice(idx, 1)
  } else {
    expandedGroups.value.push(weight)
  }
}

function onWordChange() {
  hasChanges.value = JSON.stringify(wordItems.value) !== savedSnapshot
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    nextTick(() => renderChart(activeTab.value))
  }, 300)
}

function saveWords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wordItems.value))
    savedSnapshot = JSON.stringify(wordItems.value)
    hasChanges.value = false
    nextTick(() => renderChart(activeTab.value))
  } catch (e) {
    console.error('Failed to save words:', e)
  }
}

function refreshChart() {
  nextTick(() => renderChart(activeTab.value))
}

function buildChartData(tab: string) {
  return wordItems.value.map((item) => {
    let name: string
    if (tab === 'cn') {
      name = item.cn
    } else if (tab === 'bilingual') {
      name = `${item.cn} / ${item.en}`
    } else {
      name = item.en
    }
    return {
      name,
      value: item.value,
      textStyle: {
        color: colorMap.value[item.value] || '#999',
        fontWeight: fontWeightMap[item.value] || 400,
      },
    }
  })
}

function getBaseOption(data: any[], tab: string) {
  const fontFamily = tab === 'en'
    ? 'Inter, Arial, sans-serif'
    : "'Noto Sans SC', 'Microsoft YaHei', sans-serif"

  return {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'wordCloud',
        gridSize: 4,
        sizeRange: [12, 60],
        rotationRange: [0, 0],
        rotationStep: 0,
        shape: 'rect',
        drawOutOfBound: false,
        left: 'center',
        top: 'center',
        width: '90%',
        height: '90%',
        textStyle: {
          fontFamily,
          fontWeight: 'normal',
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            shadowBlur: 4,
            shadowColor: 'rgba(0,0,0,0.1)',
          },
        },
        data,
      },
    ],
  }
}

function renderChart(tab: string) {
  if (!chartInstance) return
  const data = buildChartData(tab)
  chartInstance.setOption(getBaseOption(data, tab), true)
}

function switchTab(key: string) {
  if (activeTab.value === key) return
  activeTab.value = key
  nextTick(() => renderChart(activeTab.value))
}

function selectScheme(key: SchemeKey) {
  if (activeScheme.value === key) return
  activeScheme.value = key
  nextTick(() => renderChart(activeTab.value))
}

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  renderChart(activeTab.value)
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped lang="scss">
.ciyun-page {
  height: 100%;
  display: flex;
  overflow: hidden;
  background: #F5F5F7;
}

// ========== 左侧边栏 ==========
.ciyun-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  overflow-y: auto;
}

.sidebar-header {
  padding: 24px 20px 16px;
  border-bottom: 1px solid #F5F5F7;
}

.sidebar-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(90, 200, 250, 0.1));
  color: #007AFF;
  margin-bottom: 12px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0 0 4px;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
}

.sidebar-subtitle {
  font-size: 12px;
  color: #86868B;
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

// ===== 边栏区块 =====
.sidebar-section {
  padding: 20px;
  border-bottom: 1px solid #F5F5F7;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.section-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #AEAEB2;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-family: 'Inter', sans-serif;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  border-radius: 6px;
  color: #86868B;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 122, 255, 0.1);
    color: #007AFF;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: rgba(0, 0, 0, 0.03);
    color: #D2D2D7;
  }
}

.save-btn {
  &:not(:disabled):hover {
    background: rgba(52, 199, 89, 0.15);
    color: #34C759;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
}

.refresh-btn {
  padding: 4px;
}

// ===== 语言菜单 =====
.lang-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  font-size: 14px;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #86868B;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  text-align: left;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #1C1C1E;
  }

  &.active {
    background: rgba(0, 122, 255, 0.1);
    color: #007AFF;
    font-weight: 600;

    .lang-dot {
      background: #007AFF;
      box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
    }
  }
}

.lang-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D2D2D7;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

// ===== 配色方案选择 =====
.scheme-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scheme-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  font-size: 13px;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #86868B;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  text-align: left;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #1C1C1E;
  }

  &.active {
    background: rgba(0, 122, 255, 0.1);
    color: #007AFF;
    font-weight: 600;
  }
}

.scheme-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform 0.25s ease;

  &.natural {
    background: conic-gradient(
      #6B2117 0deg 60deg,
      #930A7B 60deg 120deg,
      #3F6E86 120deg 180deg,
      #188863 180deg 240deg,
      #567F18 240deg 300deg,
      #9D984F 300deg 360deg
    );
  }

  &.vivid {
    background: conic-gradient(
      #8B2E2E 0deg 60deg,
      #6B8E23 60deg 120deg,
      #9932CC 120deg 180deg,
      #1E90FF 180deg 240deg,
      #2E8B57 240deg 300deg,
      #333333 300deg 360deg
    );
  }

  &.bright {
    background: conic-gradient(
      #8B2E2E 0deg 60deg,
      #6B8E23 60deg 120deg,
      #9932CC 120deg 180deg,
      #4A7C8C 180deg 240deg,
      #2E8B57 240deg 300deg,
      #333333 300deg 360deg
    );
  }

  &.vintage {
    background: conic-gradient(
      #5D2E2E 0deg 60deg,
      #7B3F61 60deg 120deg,
      #1A4F4A 120deg 180deg,
      #5A6E2B 180deg 240deg,
      #5B6C7D 240deg 300deg,
      #B8863B 300deg 360deg
    );
  }

  &.morandi {
    background: conic-gradient(
      #5A6B7D 0deg 60deg,
      #7B9B8B 60deg 120deg,
      #A78B9F 120deg 180deg,
      #C9A895 180deg 240deg,
      #9CAFB5 240deg 300deg,
      #D4C9B8 300deg 360deg
    );
  }
}

.scheme-name {
  font-size: 13px;
}

// ===== 关键词编辑区域 =====
.keyword-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.keyword-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #D2D2D7;
    border-radius: 2px;
  }
}

.keyword-group {
  margin-bottom: 4px;
}

.group-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  font-size: 12px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #64748B;
  background: rgba(0, 0, 0, 0.02);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  text-align: left;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #1C1C1E;
  }
}

.group-swatch {
  width: 8px;
  height: 8px;
  border-radius: 3px;
  flex-shrink: 0;
}

.group-label {
  flex: 1;
  font-weight: 600;
}

.group-count {
  font-size: 11px;
  color: #AEAEB2;
  background: rgba(0, 0, 0, 0.04);
  padding: 1px 5px;
  border-radius: 10px;
}

.group-arrow {
  flex-shrink: 0;
  color: #D2D2D7;
  transition: transform 0.25s ease;

  &.expanded {
    transform: rotate(180deg);
  }
}

.group-items {
  padding: 4px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.keyword-item {
  display: flex;
  gap: 6px;
}

.keyword-input {
  flex: 1;
  padding: 4px 8px;
  font-size: 11px;
  font-family: 'Noto Sans SC', 'Inter', sans-serif;
  color: #1C1C1E;
  background: #F5F5F7;
  border: 1px solid transparent;
  border-radius: 4px;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #007AFF;
    background: #fff;
  }

  &::placeholder {
    color: #AEAEB2;
  }

  &.cn-input {
    font-family: 'Noto Sans SC', sans-serif;
  }

  &.en-input {
    font-family: 'Inter', sans-serif;
    flex: 1;
  }
}

// ===== 侧边栏底部 — 图例 =====
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #F5F5F7;
}

.legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  font-size: 12px;
  color: #64748B;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

// ========== 主内容区 ==========
.ciyun-main {
  flex: 1;
  min-width: 0;
  padding: 20px 28px;
  overflow: hidden;
  display: flex;
}

.dashboard-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.05);
  padding: 24px;
  overflow: hidden;
}

.ciyun-chart {
  flex: 1;
  width: 100%;
  min-height: 0;
}

// ===== 响应式 =====
@media (max-width: 768px) {
  .ciyun-page {
    flex-direction: column;
  }

  .ciyun-sidebar {
    width: 100%;
    max-height: 400px;
    flex-shrink: 0;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .sidebar-header {
    padding: 16px;
  }

  .sidebar-section {
    padding: 12px 16px;
  }

  .sidebar-footer {
    padding: 12px 16px;
  }

  .ciyun-main {
    padding: 12px 16px;
  }

  .dashboard-card {
    border-radius: 16px;
    padding: 16px;
  }
}

// ===== 深色模式 =====
.dark-mode {
  .ciyun-sidebar {
    background: rgba(15, 23, 42, 0.95);
    border-right-color: rgba(255, 255, 255, 0.08);
  }

  .sidebar-header {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .sidebar-icon {
    background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(59, 130, 246, 0.1));
    color: #60A5FA;
  }

  .sidebar-title {
    color: #F8FAFC;
  }

  .sidebar-subtitle {
    color: #94A3B8;
  }

  .sidebar-section {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .section-label {
    color: #64748B;
  }

  .lang-item {
    color: #94A3B8;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #F8FAFC;
    }

    &.active {
      background: rgba(59, 130, 246, 0.15);
      color: #60A5FA;
    }
  }

  .lang-dot {
    background: #475569;
  }

  .scheme-item {
    color: #94A3B8;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #F8FAFC;
    }

    &.active {
      background: rgba(59, 130, 246, 0.15);
      color: #60A5FA;
    }
  }

  .action-btn {
    background: rgba(255, 255, 255, 0.05);
    color: #94A3B8;

    &:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.15);
      color: #60A5FA;
    }
  }

  .save-btn {
    &:not(:disabled):hover {
      background: rgba(52, 199, 89, 0.15);
      color: #34C759;
    }
  }

  .refresh-btn {
    &:hover {
      background: rgba(59, 130, 246, 0.15);
      color: #60A5FA;
    }
  }

  .keyword-list {
    &::-webkit-scrollbar-thumb {
      background: #334155;
    }
  }

  .group-header {
    background: rgba(255, 255, 255, 0.03);
    color: #94A3B8;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #F8FAFC;
    }
  }

  .group-count {
    background: rgba(255, 255, 255, 0.05);
    color: #64748B;
  }

  .group-arrow {
    color: #475569;
  }

  .keyword-input {
    background: rgba(255, 255, 255, 0.05);
    color: #F8FAFC;

    &:focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: #3B82F6;
    }

    &::placeholder {
      color: #475569;
    }
  }

  .legend-label {
    color: #94A3B8;
  }

  .sidebar-footer {
    border-top-color: rgba(255, 255, 255, 0.06);
  }

  .dashboard-card {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }
}
</style>
