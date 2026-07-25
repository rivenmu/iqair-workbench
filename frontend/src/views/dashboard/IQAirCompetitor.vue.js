import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Check, Camera, Clock } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { dashboardApi } from '@/api/dashboard';
import dayjs from 'dayjs';
const PROJECT_ID = 1;
const STORAGE_KEY = 'iqair_dashboard_state_v3';
const DATA_VERSION = 'competitor-data-v2';
const defaultIQAirLogo = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23D32F2F' rx='20'/><text x='50' y='65' font-family='Arial' font-size='40' font-weight='bold' fill='white' text-anchor='middle'>IQ</text></svg>";
const chartRef = ref();
let chartInstance = null;
let updateTimer = null;
const loading = ref(false);
const isEditMode = ref(false);
const brands = ref([]);
const periods = ref([]);
const snapshots = ref([]);
const visibleBrands = computed(() => brands.value.filter(brand => brand.visible !== false));
const uiTexts = reactive({
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
});
const snapshotDialogVisible = ref(false);
const showHistoryDialog = ref(false);
const loadedAt = ref('');
const snapshotNote = ref('');
const snapshotting = ref(false);
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
};
function isIQAirBrand(name) {
    return name?.trim().toLowerCase() === 'iqair';
}
function formatNum(num) {
    return Math.round(num).toLocaleString('zh-CN');
}
function formatDate(date) {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}
// ================== 数据加载 ==================
async function fetchData() {
    loading.value = true;
    try {
        const data = await dashboardApi.getData(PROJECT_ID);
        loadedAt.value = data._serverTime || new Date().toISOString();
        // 优先使用后端返回的 UI 文本（跨环境/跨域名共享的权威源）
        if (data.uiTexts && typeof data.uiTexts === 'object') {
            Object.keys(uiTexts).forEach((k) => { delete uiTexts[k]; });
            Object.assign(uiTexts, data.uiTexts);
        }
        // 通过版本号执行一次数据升级，确保已有项目也切换到最新的 10 品牌数据。
        if (data.uiTexts?.competitorDataVersion !== DATA_VERSION) {
            periods.value = defaultData.periods;
            brands.value = cloneDefaultBrands();
            mergeLocalBrandPreferences();
            uiTexts.competitorDataVersion = DATA_VERSION;
            await saveDataToBackend(false);
        }
        else if (data.brands && data.brands.length > 0) {
            periods.value = data.periods || [];
            brands.value = normalizeBrands(data.brands);
            mergeLocalBrandPreferences();
        }
        else {
            periods.value = defaultData.periods;
            brands.value = cloneDefaultBrands();
            uiTexts.competitorDataVersion = DATA_VERSION;
            await saveDataToBackend(false);
        }
        persistToLocalStorage();
        pipelineProcessData();
        await nextTick();
        renderChart();
    }
    catch (_error) {
        // 后端请求失败，尝试从 localStorage 加载
        loadFromLocalStorage();
    }
    finally {
        loading.value = false;
    }
}
function cloneDefaultBrands() {
    return JSON.parse(JSON.stringify(defaultData.brands));
}
function normalizeBrands(brandList) {
    return brandList.map((brand) => ({
        ...brand,
        visible: brand.visible !== false
    }));
}
function mergeLocalBrandPreferences() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved)
        return;
    try {
        const state = JSON.parse(saved);
        if (state.brands && brands.value.length > 0) {
            state.brands.forEach((savedBrand) => {
                const currentBrand = brands.value.find(brand => brand.name === savedBrand.name);
                if (!currentBrand)
                    return;
                if (savedBrand.logo && !currentBrand.logo)
                    currentBrand.logo = savedBrand.logo;
                if (typeof savedBrand.visible === 'boolean')
                    currentBrand.visible = savedBrand.visible;
            });
        }
    }
    catch {
        // 解析失败，忽略
    }
}
function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const state = JSON.parse(saved);
            const needsSeed = state.dataVersion !== DATA_VERSION && state.uiTexts?.competitorDataVersion !== DATA_VERSION;
            periods.value = needsSeed ? defaultData.periods : (state.periods || defaultData.periods);
            brands.value = needsSeed ? cloneDefaultBrands() : normalizeBrands(state.brands || cloneDefaultBrands());
            if (state.uiTexts) {
                Object.assign(uiTexts, state.uiTexts);
            }
            uiTexts.competitorDataVersion = DATA_VERSION;
            mergeLocalBrandPreferences();
        }
        catch {
            periods.value = defaultData.periods;
            brands.value = cloneDefaultBrands();
            uiTexts.competitorDataVersion = DATA_VERSION;
        }
    }
    else {
        periods.value = defaultData.periods;
        brands.value = cloneDefaultBrands();
        uiTexts.competitorDataVersion = DATA_VERSION;
    }
    pipelineProcessData();
    nextTick(() => renderChart());
}
function persistToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        dataVersion: DATA_VERSION,
        periods: periods.value,
        brands: brands.value,
        uiTexts: uiTexts
    }));
}
async function fetchSnapshots() {
    try {
        const data = await dashboardApi.getSnapshots(PROJECT_ID);
        snapshots.value = Array.isArray(data) ? data : [];
    }
    catch {
        snapshots.value = [];
    }
}
// ================== 数据处理 ==================
function pipelineProcessData() {
    if (!isEditMode.value && brands.value.length > 0) {
        const lastIdx = periods.value.length - 1;
        if (lastIdx >= 0) {
            brands.value.sort((a, b) => (b.filterRev[lastIdx] || 0) - (a.filterRev[lastIdx] || 0));
        }
    }
}
// ================== 编辑模式 ==================
function toggleEditMode() {
    if (isEditMode.value) {
        // 退出编辑模式，保存数据
        pipelineProcessData();
        saveDataToBackend(true);
        renderChart();
    }
    isEditMode.value = !isEditMode.value;
    ElMessage.success(isEditMode.value ? '已进入编辑模式' : '修改已保存');
}
function toggleBrandVisibility(brand, checked) {
    brand.visible = checked;
    persistToLocalStorage();
    nextTick(() => renderChart());
}
async function saveDataToBackend(showMessage) {
    try {
        const payload = { periods: periods.value, brands: brands.value, uiTexts: { ...uiTexts } };
        if (loadedAt.value)
            payload._loaded_at = loadedAt.value;
        await dashboardApi.saveData(PROJECT_ID, payload);
        persistToLocalStorage();
        if (showMessage)
            fetchSnapshots();
    }
    catch (error) {
        if (error?.status === 409) {
            ElMessage.warning('数据已被他人修改，请刷新获取最新版本');
        }
        else {
            ElMessage.error('保存失败，请稍后重试');
        }
    }
}
// ================== UI 文本编辑 ==================
let uiTextSyncTimer = null;
function saveUIText(event, key) {
    if (!isEditMode.value)
        return;
    const newValue = event.target.innerText.trim();
    if (uiTexts[key] === newValue)
        return;
    uiTexts[key] = newValue;
    persistToLocalStorage();
    if (['chartLegendSales', 'chartLegendPct', 'xAxisBrand', 'xAxisTime', 'yAxisSales', 'yAxisPct'].includes(key)) {
        renderChart();
    }
    // 防抖同步到后端，确保局域网/外网/不同浏览器一致
    if (uiTextSyncTimer)
        clearTimeout(uiTextSyncTimer);
    uiTextSyncTimer = setTimeout(async () => {
        try {
            await dashboardApi.saveUITexts(PROJECT_ID, { [key]: newValue });
        }
        catch {
            // 后端同步失败，localStorage 仍保留，恢复网络后可下次触发时重试
        }
    }, 400);
}
function flushUiTextSync() {
    if (uiTextSyncTimer) {
        clearTimeout(uiTextSyncTimer);
        uiTextSyncTimer = null;
    }
    dashboardApi.saveUITexts(PROJECT_ID, { ...uiTexts }).catch(() => { });
}
function updateBrandName(event, brand) {
    if (!isEditMode.value)
        return;
    brand.name = event.target.innerText.trim();
    persistToLocalStorage();
    if (updateTimer)
        clearTimeout(updateTimer);
    updateTimer = setTimeout(() => renderChart(), 300);
}
// ================== 数据修改 ==================
// handleDataChange removed -- replaced by v-model
// ================== Logo 上传 ==================
async function handleLogoUpload(file, brandIndex) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        brands.value[brandIndex].logo = e.target?.result;
        persistToLocalStorage();
        renderChart();
        await saveDataToBackend(false);
        ElMessage.success(`${brands.value[brandIndex].name} Logo 上传成功`);
    };
    reader.readAsDataURL(file);
    return false;
}
// ================== ECharts 图表 ==================
function renderChart() {
    if (!chartRef.value)
        return;
    // 容器尺寸为 0 时（路由过渡中），延迟重试
    if (chartRef.value.offsetWidth === 0 || chartRef.value.offsetHeight === 0) {
        if (updateTimer)
            clearTimeout(updateTimer);
        updateTimer = setTimeout(() => renderChart(), 150);
        return;
    }
    if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value);
    }
    const periodLabels = periods.value.map((period, index) => uiTexts['thYear_' + index] || period);
    const periodCount = Math.max(periodLabels.length, 1);
    const groupSize = periodCount + 1;
    const xLabels = [];
    const brandLabels = [];
    const revenueData = [];
    const percentageData = [];
    const displayBrands = visibleBrands.value;
    displayBrands.forEach((brand) => {
        periodLabels.forEach((period, periodIndex) => {
            xLabels.push(period);
            brandLabels.push(brand.name);
            revenueData.push(Number(brand.filterRev?.[periodIndex] || 0));
            percentageData.push(Number(brand.filterPct?.[periodIndex] || 0));
        });
        // 空分类切断不同品牌之间的占比折线，同时让品牌分组更清晰。
        xLabels.push('');
        brandLabels.push('');
        revenueData.push(null);
        percentageData.push(null);
    });
    const seriesData = [
        {
            name: uiTexts.chartLegendSales || '滤芯销售额',
            type: 'bar',
            xAxisIndex: 1,
            data: revenueData,
            barWidth: '58%',
            barCategoryGap: '24%',
            itemStyle: {
                color: (params) => {
                    const brand = displayBrands[Math.floor(params.dataIndex / groupSize)];
                    return isIQAirBrand(brand?.name) ? '#D32F2F' : (brand?.color || '#64748B');
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
    ];
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'line' },
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: '#cbd5e1',
            borderWidth: 1,
            padding: 12,
            extraCssText: 'backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
            formatter: function (params) {
                const pointList = (Array.isArray(params) ? params : [params]).filter((point) => point?.dataIndex !== undefined);
                const dataIndex = pointList[0]?.dataIndex;
                const brandIndex = Math.floor(dataIndex / groupSize);
                const periodIndex = dataIndex % groupSize;
                const brandObj = displayBrands[brandIndex];
                if (periodIndex >= periodCount || !brandObj)
                    return '';
                const finalLogo = brandObj.logo || (isIQAirBrand(brandObj.name) ? defaultIQAirLogo : '');
                const logoHtml = finalLogo
                    ? `<img src="${finalLogo}" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;border-radius:2px;" />`
                    : '';
                const period = periodLabels[periodIndex];
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
        </div>`;
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
                    formatter: (_value, index) => index % groupSize === Math.floor(periodCount / 2)
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
                axisLabel: { color: '#86868B', fontSize: 11, formatter: (val) => val.toLocaleString('zh-CN') }
            },
            {
                type: 'value',
                name: uiTexts.yAxisPct || '滤芯占比 (%)',
                splitLine: { show: false },
                axisLabel: { color: '#86868B', fontSize: 11, formatter: '{value}%' }
            }
        ],
        series: seriesData
    };
    chartInstance.setOption(option, true);
}
// ================== 快照管理 ==================
function openSnapshotDialog() {
    snapshotNote.value = '';
    snapshotDialogVisible.value = true;
}
async function handleCreateSnapshot() {
    snapshotting.value = true;
    try {
        await dashboardApi.createSnapshot(PROJECT_ID, { note: snapshotNote.value });
        ElMessage.success('快照保存成功');
        snapshotDialogVisible.value = false;
        fetchSnapshots();
    }
    catch {
        // 错误已在拦截器处理
    }
    finally {
        snapshotting.value = false;
    }
}
async function handleRestore(snapshotId) {
    try {
        await ElMessageBox.confirm('确定要恢复到此快照吗？当前数据将被覆盖。', '撤销确认', {
            confirmButtonText: '恢复',
            cancelButtonText: '取消',
            type: 'warning'
        });
        await dashboardApi.restoreSnapshot(PROJECT_ID, snapshotId);
        ElMessage.success('恢复成功');
        showHistoryDialog.value = false;
        fetchData();
        fetchSnapshots();
    }
    catch {
        // 用户取消或错误
    }
}
// ================== 生命周期 ==================
function handleResize() {
    chartInstance?.resize();
}
onMounted(() => {
    fetchData();
    fetchSnapshots();
    window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    chartInstance?.dispose();
    if (updateTimer)
        clearTimeout(updateTimer);
});
watch(showHistoryDialog, (val) => {
    if (val)
        fetchSnapshots();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['brand-check']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-input']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-input']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-input']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-input']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-input']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-input']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-input']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "iqair-competitor" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "sidebar-title" },
});
(__VLS_ctx.uiTexts.sidebarTitle || '配置面板');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "sidebar-sub" },
});
(__VLS_ctx.uiTexts.sidebarSub || '双模态联动 v3.0');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-list" },
});
for (const [brand, idx] of __VLS_getVForSourceType((__VLS_ctx.brands))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (idx),
        ...{ class: "brand-row" },
        ...{ class: ({ 'is-iqair': __VLS_ctx.isIQAirBrand(brand.name) }) },
    });
    const __VLS_0 = {}.ElCheckbox;
    /** @type {[typeof __VLS_components.ElCheckbox, typeof __VLS_components.elCheckbox, typeof __VLS_components.ElCheckbox, typeof __VLS_components.elCheckbox, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ 'onChange': {} },
        ...{ class: "brand-check" },
        modelValue: (brand.visible !== false),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onChange': {} },
        ...{ class: "brand-check" },
        modelValue: (brand.visible !== false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_4;
    let __VLS_5;
    let __VLS_6;
    const __VLS_7 = {
        onChange: (...[$event]) => {
            __VLS_ctx.toggleBrandVisibility(brand, $event);
        }
    };
    __VLS_3.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "brand-name" },
        ...{ style: ({ color: __VLS_ctx.isIQAirBrand(brand.name) ? '#D32F2F' : '#334155' }) },
    });
    (brand.name);
    var __VLS_3;
    const __VLS_8 = {}.ElUpload;
    /** @type {[typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        showFileList: (false),
        beforeUpload: ((file) => __VLS_ctx.handleLogoUpload(file, idx)),
        accept: "image/*",
    }));
    const __VLS_10 = __VLS_9({
        showFileList: (false),
        beforeUpload: ((file) => __VLS_ctx.handleLogoUpload(file, idx)),
        accept: "image/*",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    const __VLS_12 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        size: "small",
        type: (brand.logo ? 'success' : 'default'),
        plain: true,
    }));
    const __VLS_14 = __VLS_13({
        size: "small",
        type: (brand.logo ? 'success' : 'default'),
        plain: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    (brand.logo ? '已上传 ✓' : '上传 Logo');
    var __VLS_15;
    var __VLS_11;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "section-desc" },
});
(__VLS_ctx.uiTexts.sec2Desc || '点击开启编辑模式，直接在右侧图表下方的数据表格内输入或修改数值，实时映射至柱状图。');
const __VLS_16 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
    type: (__VLS_ctx.isEditMode ? 'success' : 'primary'),
    ...{ class: "edit-toggle-btn" },
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    type: (__VLS_ctx.isEditMode ? 'success' : 'primary'),
    ...{ class: "edit-toggle-btn" },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (__VLS_ctx.toggleEditMode)
};
__VLS_19.slots.default;
const __VLS_24 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({}));
const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
if (!__VLS_ctx.isEditMode) {
    const __VLS_28 = {}.Edit;
    /** @type {[typeof __VLS_components.Edit, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({}));
    const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
}
else {
    const __VLS_32 = {}.Check;
    /** @type {[typeof __VLS_components.Check, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({}));
    const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
}
var __VLS_27;
(__VLS_ctx.isEditMode ? '保存修改' : '进入编辑模式');
var __VLS_19;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mode-indicator" },
    ...{ class: (__VLS_ctx.isEditMode ? 'mode-edit' : 'mode-view') },
});
(__VLS_ctx.isEditMode ? '正在编辑' : '只读预览');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-label-list" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-label-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'chartLegendSales');
        } },
    ...{ class: "editable-text chart-label-value" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.chartLegendSales || '滤芯销售额XX');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-label-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'chartLegendPct');
        } },
    ...{ class: "editable-text chart-label-value" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.chartLegendPct || '滤芯占比XX');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-label-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'xAxisBrand');
        } },
    ...{ class: "editable-text chart-label-value" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.xAxisBrand || '品牌XX');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-label-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'xAxisTime');
        } },
    ...{ class: "editable-text chart-label-value" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.xAxisTime || '时间');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-label-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'yAxisSales');
        } },
    ...{ class: "editable-text chart-label-value" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.yAxisSales || '销售额 (元)');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-label-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'yAxisPct');
        } },
    ...{ class: "editable-text chart-label-value" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.yAxisPct || '滤芯占比 (%)');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
const __VLS_36 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
    disabled: (!__VLS_ctx.brands.length),
}));
const __VLS_38 = __VLS_37({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
    disabled: (!__VLS_ctx.brands.length),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_40;
let __VLS_41;
let __VLS_42;
const __VLS_43 = {
    onClick: (__VLS_ctx.openSnapshotDialog)
};
__VLS_39.slots.default;
const __VLS_44 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({}));
const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.Camera;
/** @type {[typeof __VLS_components.Camera, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({}));
const __VLS_50 = __VLS_49({}, ...__VLS_functionalComponentArgsRest(__VLS_49));
var __VLS_47;
var __VLS_39;
const __VLS_52 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
}));
const __VLS_54 = __VLS_53({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
let __VLS_56;
let __VLS_57;
let __VLS_58;
const __VLS_59 = {
    onClick: (...[$event]) => {
        __VLS_ctx.showHistoryDialog = true;
    }
};
__VLS_55.slots.default;
const __VLS_60 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({}));
const __VLS_62 = __VLS_61({}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.Clock;
/** @type {[typeof __VLS_components.Clock, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({}));
const __VLS_66 = __VLS_65({}, ...__VLS_functionalComponentArgsRest(__VLS_65));
var __VLS_63;
var __VLS_55;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "main-workspace" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dashboard-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "main-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'mainTitle');
        } },
    ...{ class: "editable-text" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.mainTitle || '核心品牌滤芯销售额及占比演变');
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'mainSubSpan');
        } },
    ...{ class: "main-sub" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.mainSubSpan || '(2024 H1 - 2026 H1)');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "main-desc" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'mainDesc');
        } },
    ...{ class: "editable-text" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.mainDesc || '数据按 2026 H1 滤芯销售额降序排列；横轴按品牌分组展示三个半年度数据');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "chartRef",
    ...{ class: "chart-container" },
});
/** @type {typeof __VLS_ctx.chartRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ class: "data-table" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
    rowspan: "2",
    ...{ class: "brand-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'thBrand');
        } },
    ...{ class: "editable-text" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.thBrand || '品牌 / 期间');
for (const [period, idx] of __VLS_getVForSourceType((__VLS_ctx.periods))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        key: (idx),
        colspan: "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onBlur: (...[$event]) => {
                __VLS_ctx.saveUIText($event, 'thYear_' + idx);
            } },
        ...{ class: "editable-text" },
        contenteditable: (__VLS_ctx.isEditMode),
    });
    (period);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
for (const [period, idx] of __VLS_getVForSourceType((__VLS_ctx.periods))) {
    (idx);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "sub-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onBlur: (...[$event]) => {
                __VLS_ctx.saveUIText($event, 'thSales');
            } },
        ...{ class: "editable-text" },
        contenteditable: (__VLS_ctx.isEditMode),
    });
    (__VLS_ctx.uiTexts.thSales || '销售额 (元)');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "sub-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onBlur: (...[$event]) => {
                __VLS_ctx.saveUIText($event, 'thPct');
            } },
        ...{ class: "editable-text" },
        contenteditable: (__VLS_ctx.isEditMode),
    });
    (__VLS_ctx.uiTexts.thPct || '滤芯占比');
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
for (const [brand] of __VLS_getVForSourceType((__VLS_ctx.visibleBrands))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        key: (brand.name),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "brand-col" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "brand-cell" },
    });
    if (brand.logo || __VLS_ctx.isIQAirBrand(brand.name)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (brand.logo || __VLS_ctx.defaultIQAirLogo),
            ...{ class: "brand-logo" },
            alt: "logo",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "logo-placeholder" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onBlur: (...[$event]) => {
                __VLS_ctx.updateBrandName($event, brand);
            } },
        ...{ class: "editable-text brand-name-cell" },
        contenteditable: (__VLS_ctx.isEditMode),
        ...{ style: ({
                color: __VLS_ctx.isIQAirBrand(brand.name) ? '#D32F2F' : brand.color,
                fontWeight: __VLS_ctx.isIQAirBrand(brand.name) ? '700' : '600'
            }) },
    });
    (brand.name);
    for (const [period, yIdx] of __VLS_getVForSourceType((__VLS_ctx.periods))) {
        (yIdx);
        if (__VLS_ctx.isEditMode) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ class: "editing-cell" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "cell-input" },
            });
            (brand.filterRev[yIdx]);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.formatNum(brand.filterRev[yIdx]));
        }
        if (__VLS_ctx.isEditMode) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ class: "editing-cell" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "cell-input" },
            });
            (brand.filterPct[yIdx]);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (brand.filterPct[yIdx]);
        }
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "note-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "note-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ onBlur: (...[$event]) => {
            __VLS_ctx.saveUIText($event, 'footerNote');
        } },
    ...{ class: "editable-text note-content" },
    contenteditable: (__VLS_ctx.isEditMode),
});
(__VLS_ctx.uiTexts.footerNote);
const __VLS_68 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    modelValue: (__VLS_ctx.snapshotDialogVisible),
    title: "保存快照",
    width: "440px",
}));
const __VLS_70 = __VLS_69({
    modelValue: (__VLS_ctx.snapshotDialogVisible),
    title: "保存快照",
    width: "440px",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({}));
const __VLS_74 = __VLS_73({}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
const __VLS_76 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    label: "备注",
}));
const __VLS_78 = __VLS_77({
    label: "备注",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    modelValue: (__VLS_ctx.snapshotNote),
    type: "textarea",
    rows: (3),
    placeholder: "可选：快照备注说明",
}));
const __VLS_82 = __VLS_81({
    modelValue: (__VLS_ctx.snapshotNote),
    type: "textarea",
    rows: (3),
    placeholder: "可选：快照备注说明",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
var __VLS_79;
var __VLS_75;
{
    const { footer: __VLS_thisSlot } = __VLS_71.slots;
    const __VLS_84 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        ...{ 'onClick': {} },
    }));
    const __VLS_86 = __VLS_85({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    let __VLS_88;
    let __VLS_89;
    let __VLS_90;
    const __VLS_91 = {
        onClick: (...[$event]) => {
            __VLS_ctx.snapshotDialogVisible = false;
        }
    };
    __VLS_87.slots.default;
    var __VLS_87;
    const __VLS_92 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.snapshotting),
    }));
    const __VLS_94 = __VLS_93({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.snapshotting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    let __VLS_96;
    let __VLS_97;
    let __VLS_98;
    const __VLS_99 = {
        onClick: (__VLS_ctx.handleCreateSnapshot)
    };
    __VLS_95.slots.default;
    var __VLS_95;
}
var __VLS_71;
const __VLS_100 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    modelValue: (__VLS_ctx.showHistoryDialog),
    title: "操作历史",
    width: "700px",
}));
const __VLS_102 = __VLS_101({
    modelValue: (__VLS_ctx.showHistoryDialog),
    title: "操作历史",
    width: "700px",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
__VLS_103.slots.default;
if (__VLS_ctx.snapshots.length) {
    const __VLS_104 = {}.ElTimeline;
    /** @type {[typeof __VLS_components.ElTimeline, typeof __VLS_components.elTimeline, typeof __VLS_components.ElTimeline, typeof __VLS_components.elTimeline, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({}));
    const __VLS_106 = __VLS_105({}, ...__VLS_functionalComponentArgsRest(__VLS_105));
    __VLS_107.slots.default;
    for (const [snap] of __VLS_getVForSourceType((__VLS_ctx.snapshots))) {
        const __VLS_108 = {}.ElTimelineItem;
        /** @type {[typeof __VLS_components.ElTimelineItem, typeof __VLS_components.elTimelineItem, typeof __VLS_components.ElTimelineItem, typeof __VLS_components.elTimelineItem, ]} */ ;
        // @ts-ignore
        const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
            key: (snap.id),
            timestamp: (__VLS_ctx.formatDate(snap.timestamp)),
            type: (snap.operation_type === 'restore' ? 'warning' : 'primary'),
        }));
        const __VLS_110 = __VLS_109({
            key: (snap.id),
            timestamp: (__VLS_ctx.formatDate(snap.timestamp)),
            type: (snap.operation_type === 'restore' ? 'warning' : 'primary'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_109));
        __VLS_111.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "history-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "history-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "history-action" },
        });
        (snap.operation_type_display);
        const __VLS_112 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
            size: "small",
            type: (snap.is_manual ? 'success' : 'info'),
        }));
        const __VLS_114 = __VLS_113({
            size: "small",
            type: (snap.is_manual ? 'success' : 'info'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_113));
        __VLS_115.slots.default;
        (snap.is_manual ? '手动' : '自动');
        var __VLS_115;
        if (snap.note) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "history-note" },
            });
            (snap.note);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "history-user" },
        });
        (snap.username);
        if (snap.operation_type !== 'restore') {
            const __VLS_116 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
                ...{ 'onClick': {} },
                size: "small",
                type: "warning",
            }));
            const __VLS_118 = __VLS_117({
                ...{ 'onClick': {} },
                size: "small",
                type: "warning",
            }, ...__VLS_functionalComponentArgsRest(__VLS_117));
            let __VLS_120;
            let __VLS_121;
            let __VLS_122;
            const __VLS_123 = {
                onClick: (...[$event]) => {
                    if (!(__VLS_ctx.snapshots.length))
                        return;
                    if (!(snap.operation_type !== 'restore'))
                        return;
                    __VLS_ctx.handleRestore(snap.id);
                }
            };
            __VLS_119.slots.default;
            var __VLS_119;
        }
        var __VLS_111;
    }
    var __VLS_107;
}
else {
    const __VLS_124 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        description: "暂无操作历史",
    }));
    const __VLS_126 = __VLS_125({
        description: "暂无操作历史",
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
}
var __VLS_103;
/** @type {__VLS_StyleScopedClasses['iqair-competitor']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-title']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-content']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-list']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-row']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-check']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-name']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-toggle-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['mode-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-list']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-row']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-row']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-row']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-row']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-row']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-row']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-label-value']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['main-workspace']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-card']} */ ;
/** @type {__VLS_StyleScopedClasses['header-section']} */ ;
/** @type {__VLS_StyleScopedClasses['main-title']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['main-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['main-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['table-section']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-col']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-header']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-header']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-col']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-name-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['editing-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-input']} */ ;
/** @type {__VLS_StyleScopedClasses['editing-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-input']} */ ;
/** @type {__VLS_StyleScopedClasses['note-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['note-label']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-text']} */ ;
/** @type {__VLS_StyleScopedClasses['note-content']} */ ;
/** @type {__VLS_StyleScopedClasses['history-item']} */ ;
/** @type {__VLS_StyleScopedClasses['history-header']} */ ;
/** @type {__VLS_StyleScopedClasses['history-action']} */ ;
/** @type {__VLS_StyleScopedClasses['history-note']} */ ;
/** @type {__VLS_StyleScopedClasses['history-user']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Edit: Edit,
            Check: Check,
            Camera: Camera,
            Clock: Clock,
            defaultIQAirLogo: defaultIQAirLogo,
            chartRef: chartRef,
            isEditMode: isEditMode,
            brands: brands,
            periods: periods,
            snapshots: snapshots,
            visibleBrands: visibleBrands,
            uiTexts: uiTexts,
            snapshotDialogVisible: snapshotDialogVisible,
            showHistoryDialog: showHistoryDialog,
            snapshotNote: snapshotNote,
            snapshotting: snapshotting,
            isIQAirBrand: isIQAirBrand,
            formatNum: formatNum,
            formatDate: formatDate,
            toggleEditMode: toggleEditMode,
            toggleBrandVisibility: toggleBrandVisibility,
            saveUIText: saveUIText,
            updateBrandName: updateBrandName,
            handleLogoUpload: handleLogoUpload,
            openSnapshotDialog: openSnapshotDialog,
            handleCreateSnapshot: handleCreateSnapshot,
            handleRestore: handleRestore,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
