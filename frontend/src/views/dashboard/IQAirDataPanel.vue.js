import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled, Download, Refresh, RefreshLeft, CircleCheckFilled, WarningFilled } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { platformApi } from '@/api/dashboard';
const periodType = ref('daily');
const dateRange = ref(null);
const tmallData = ref(null);
const jdData = ref(null);
const loading = reactive({ tmall: false, jd: false });
const uploadResult = ref('');
const uploadError = ref(false);
const tmallChartRef = ref();
const jdChartRef = ref();
let tmallChart = null;
let jdChart = null;
let renderTimer = null;
// 表格排序状态
const sortState = reactive({
    tmall: { prop: 'label', order: 'ascending' },
    jd: { prop: 'label', order: 'ascending' }
});
const hasData = computed(() => !!(tmallData.value?.records?.length || jdData.value?.records?.length));
const overviewStats = computed(() => {
    const stats = [];
    if (tmallData.value?.summary && Object.keys(tmallData.value.summary).length) {
        const s = tmallData.value.summary;
        stats.push({ platform: '天猫', color: '#FF0036', totalSales: s.total_sales, yoyGrowth: s.yoy_growth });
    }
    if (jdData.value?.summary && Object.keys(jdData.value.summary).length) {
        const s = jdData.value.summary;
        stats.push({ platform: '京东', color: '#E1251B', totalSales: s.total_sales, yoyGrowth: s.yoy_growth });
    }
    return stats;
});
function formatNum(num) {
    return Math.round(num).toLocaleString('zh-CN');
}
// ================== 数据加载 ==================
async function loadPlatformData(platform) {
    loading[platform] = true;
    try {
        const params = { platform, period_type: periodType.value };
        if (dateRange.value && dateRange.value.length === 2) {
            params.start_date = dateRange.value[0];
            params.end_date = dateRange.value[1];
        }
        const data = await platformApi.queryData(params);
        if (platform === 'tmall') {
            tmallData.value = data;
        }
        else {
            jdData.value = data;
        }
        await nextTick();
        renderChart(platform);
    }
    catch {
        // 错误已由拦截器处理
    }
    finally {
        loading[platform] = false;
    }
}
async function loadAll() {
    await Promise.all([loadPlatformData('tmall'), loadPlatformData('jd')]);
}
function onFilterChange() {
    loadAll();
}
function resetDateRange() {
    dateRange.value = null;
    loadAll();
}
function refreshPlatform(platform) {
    loadPlatformData(platform);
}
// ================== 上传 ==================
async function handleUpload(file) {
    loading.tmall = true;
    loading.jd = true;
    try {
        const res = await platformApi.uploadExcel(file);
        uploadResult.value = res.detail || '上传成功';
        uploadError.value = false;
        ElMessage.success(uploadResult.value);
        await loadAll();
    }
    catch (error) {
        uploadResult.value = error.response?.data?.detail || '上传失败';
        uploadError.value = true;
    }
    finally {
        loading.tmall = false;
        loading.jd = false;
    }
    return false;
}
async function downloadTemplate() {
    try {
        const res = await platformApi.downloadTemplate();
        const blob = new Blob([res], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'platform_data_template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        ElMessage.success('模板下载成功');
    }
    catch {
        ElMessage.error('模板下载失败');
    }
}
// ================== 表格排序 ==================
function onSortChange({ prop, order }, platform) {
    sortState[platform] = { prop: prop || 'label', order: order || 'ascending' };
    const data = platform === 'tmall' ? tmallData.value : jdData.value;
    if (!data?.records)
        return;
    if (!order) {
        data.records.sort((a, b) => (a.date < b.date ? -1 : 1));
    }
    else {
        data.records.sort((a, b) => {
            const va = a[prop];
            const vb = b[prop];
            if (va === null)
                return 1;
            if (vb === null)
                return -1;
            const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
            return order === 'ascending' ? cmp : -cmp;
        });
    }
    renderChart(platform);
}
// ================== 导出 ==================
function exportTable(platform) {
    const data = platform === 'tmall' ? tmallData.value : jdData.value;
    if (!data?.records?.length) {
        ElMessage.warning('暂无数据可导出');
        return;
    }
    const headers = ['期间', '销售额', '去年同期销售额', '同比(%)', '订单数', '访客数', '转化率(%)', '客单价'];
    const rows = data.records.map(r => [
        r.label, r.sales_amount, r.yoy_sales_amount ?? '',
        r.yoy_growth ?? '', r.order_count, r.visitor_count,
        r.conversion_rate, r.unit_price
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}_data_${periodType.value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
}
// ================== ECharts ==================
function renderChart(platform) {
    const data = platform === 'tmall' ? tmallData.value : jdData.value;
    const chartRef = platform === 'tmall' ? tmallChartRef.value : jdChartRef.value;
    if (!chartRef)
        return;
    if (chartRef.offsetWidth === 0 || chartRef.offsetHeight === 0) {
        if (renderTimer)
            clearTimeout(renderTimer);
        renderTimer = setTimeout(() => renderChart(platform), 150);
        return;
    }
    let chart = platform === 'tmall' ? tmallChart : jdChart;
    if (!chart) {
        chart = echarts.init(chartRef);
        if (platform === 'tmall') {
            tmallChart = chart;
        }
        else {
            jdChart = chart;
        }
    }
    if (!data?.records?.length) {
        chart.clear();
        return;
    }
    const labels = data.records.map(r => r.label);
    const primaryColor = platform === 'tmall' ? '#FF0036' : '#E1251B';
    const secondaryColor = platform === 'tmall' ? '#FF6B8A' : '#F5A0A0';
    const salesData = data.records.map(r => r.sales_amount);
    const yoySalesData = data.records.map(r => r.yoy_sales_amount);
    const orderData = data.records.map(r => r.order_count);
    const visitorData = data.records.map(r => r.visitor_count);
    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: '#cbd5e1',
            borderWidth: 1,
            padding: 12,
            extraCssText: 'backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
            formatter: (params) => {
                const idx = params[0].dataIndex;
                const rec = data.records[idx];
                let html = `<div style="font-weight:700; margin-bottom:8px; color:#1C1C1E; font-size:13px;">${rec.label}</div>`;
                html += `<div style="display:flex; justify-content:space-between; min-width:200px; margin-bottom:4px;">
          <span style="color:#64748b;">销售额:</span>
          <span style="font-weight:600; color:${primaryColor};">¥ ${formatNum(rec.sales_amount)}</span>
        </div>`;
                if (rec.yoy_sales_amount !== null) {
                    const growthColor = (rec.yoy_growth ?? 0) >= 0 ? '#10B981' : '#EF4444';
                    html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#64748b;">去年同期:</span>
            <span style="font-weight:600;">¥ ${formatNum(rec.yoy_sales_amount)}</span>
          </div>`;
                    html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#64748b;">同比:</span>
            <span style="font-weight:600; color:${growthColor};">${(rec.yoy_growth ?? 0) >= 0 ? '+' : ''}${rec.yoy_growth}%</span>
          </div>`;
                }
                html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="color:#64748b;">订单数:</span><span style="font-weight:600;">${formatNum(rec.order_count)}</span>
        </div>`;
                html += `<div style="display:flex; justify-content:space-between;">
          <span style="color:#64748b;">访客数:</span><span style="font-weight:600;">${formatNum(rec.visitor_count)}</span>
        </div>`;
                return html;
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
                axisLabel: { color: '#86868B', fontSize: 10, formatter: (val) => val >= 10000 ? (val / 10000).toFixed(1) + '万' : val }
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
    };
    chart.setOption(option, true);
}
function handleResize() {
    tmallChart?.resize();
    jdChart?.resize();
}
// ================== 生命周期 ==================
onMounted(() => {
    loadAll();
    window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    tmallChart?.dispose();
    jdChart?.dispose();
    if (renderTimer)
        clearTimeout(renderTimer);
});
// 监听数据变化重绘图表
watch([tmallData, jdData], () => {
    nextTick(() => {
        renderChart('tmall');
        renderChart('jd');
    });
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['pos']} */ ;
/** @type {__VLS_StyleScopedClasses['neg']} */ ;
/** @type {__VLS_StyleScopedClasses['el-table']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['data-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['platforms-container']} */ ;
/** @type {__VLS_StyleScopedClasses['platform-module']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['module-header']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "data-dashboard" },
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "sidebar-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "section-desc" },
});
const __VLS_0 = {}.ElUpload;
/** @type {[typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    showFileList: (false),
    beforeUpload: (__VLS_ctx.handleUpload),
    accept: ".xlsx,.xls",
    drag: true,
    ...{ class: "upload-area" },
}));
const __VLS_2 = __VLS_1({
    showFileList: (false),
    beforeUpload: (__VLS_ctx.handleUpload),
    accept: ".xlsx,.xls",
    drag: true,
    ...{ class: "upload-area" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    size: "32",
    color: "#007AFF",
}));
const __VLS_6 = __VLS_5({
    size: "32",
    color: "#007AFF",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.UploadFilled;
/** @type {[typeof __VLS_components.UploadFilled, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
var __VLS_7;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "upload-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "upload-hint" },
});
var __VLS_3;
const __VLS_12 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.downloadTemplate)
};
__VLS_15.slots.default;
const __VLS_20 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({}));
const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.Download;
/** @type {[typeof __VLS_components.Download, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({}));
const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
var __VLS_23;
var __VLS_15;
if (__VLS_ctx.uploadResult) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-result" },
        ...{ class: ({ 'is-error': __VLS_ctx.uploadError }) },
    });
    const __VLS_28 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({}));
    const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_31.slots.default;
    if (!__VLS_ctx.uploadError) {
        const __VLS_32 = {}.CircleCheckFilled;
        /** @type {[typeof __VLS_components.CircleCheckFilled, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({}));
        const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
    }
    else {
        const __VLS_36 = {}.WarningFilled;
        /** @type {[typeof __VLS_components.WarningFilled, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
        const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
    }
    var __VLS_31;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.uploadResult);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
const __VLS_40 = {}.ElRadioGroup;
/** @type {[typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.periodType),
    ...{ class: "period-group" },
}));
const __VLS_42 = __VLS_41({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.periodType),
    ...{ class: "period-group" },
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
let __VLS_44;
let __VLS_45;
let __VLS_46;
const __VLS_47 = {
    onChange: (__VLS_ctx.onFilterChange)
};
__VLS_43.slots.default;
const __VLS_48 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    value: "daily",
}));
const __VLS_50 = __VLS_49({
    value: "daily",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
var __VLS_51;
const __VLS_52 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    value: "weekly",
}));
const __VLS_54 = __VLS_53({
    value: "weekly",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
var __VLS_55;
const __VLS_56 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    value: "monthly",
}));
const __VLS_58 = __VLS_57({
    value: "monthly",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
var __VLS_59;
var __VLS_43;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
const __VLS_60 = {}.ElDatePicker;
/** @type {[typeof __VLS_components.ElDatePicker, typeof __VLS_components.elDatePicker, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.dateRange),
    type: "daterange",
    rangeSeparator: "至",
    startPlaceholder: "开始日期",
    endPlaceholder: "结束日期",
    format: "YYYY-MM-DD",
    valueFormat: "YYYY-MM-DD",
    size: "default",
    ...{ class: "date-picker" },
    clearable: (true),
}));
const __VLS_62 = __VLS_61({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.dateRange),
    type: "daterange",
    rangeSeparator: "至",
    startPlaceholder: "开始日期",
    endPlaceholder: "结束日期",
    format: "YYYY-MM-DD",
    valueFormat: "YYYY-MM-DD",
    size: "default",
    ...{ class: "date-picker" },
    clearable: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
let __VLS_64;
let __VLS_65;
let __VLS_66;
const __VLS_67 = {
    onChange: (__VLS_ctx.onFilterChange)
};
var __VLS_63;
const __VLS_68 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
    size: "small",
}));
const __VLS_70 = __VLS_69({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
let __VLS_72;
let __VLS_73;
let __VLS_74;
const __VLS_75 = {
    onClick: (__VLS_ctx.resetDateRange)
};
__VLS_71.slots.default;
const __VLS_76 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({}));
const __VLS_78 = __VLS_77({}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.RefreshLeft;
/** @type {[typeof __VLS_components.RefreshLeft, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({}));
const __VLS_82 = __VLS_81({}, ...__VLS_functionalComponentArgsRest(__VLS_81));
var __VLS_79;
var __VLS_71;
if (__VLS_ctx.hasData) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sidebar-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.overviewStats))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "overview-item" },
            key: (item.platform),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "overview-platform" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "platform-dot" },
            ...{ style: ({ background: item.color }) },
        });
        (item.platform);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "overview-sales" },
        });
        (__VLS_ctx.formatNum(item.totalSales));
        if (item.yoyGrowth !== null) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "overview-yoy" },
                ...{ class: (item.yoyGrowth >= 0 ? 'pos' : 'neg') },
            });
            (item.yoyGrowth >= 0 ? '+' : '');
            (item.yoyGrowth);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "overview-yoy" },
            });
        }
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "tips-list" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "main-workspace" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "platforms-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "platform-module" },
});
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading.tmall) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "module-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "module-title-area" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "platform-badge tmall" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "module-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "module-actions" },
});
const __VLS_84 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    ...{ 'onClick': {} },
    size: "small",
    plain: true,
}));
const __VLS_86 = __VLS_85({
    ...{ 'onClick': {} },
    size: "small",
    plain: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
let __VLS_88;
let __VLS_89;
let __VLS_90;
const __VLS_91 = {
    onClick: (...[$event]) => {
        __VLS_ctx.exportTable('tmall');
    }
};
__VLS_87.slots.default;
const __VLS_92 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({}));
const __VLS_94 = __VLS_93({}, ...__VLS_functionalComponentArgsRest(__VLS_93));
__VLS_95.slots.default;
const __VLS_96 = {}.Download;
/** @type {[typeof __VLS_components.Download, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({}));
const __VLS_98 = __VLS_97({}, ...__VLS_functionalComponentArgsRest(__VLS_97));
var __VLS_95;
var __VLS_87;
const __VLS_100 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    ...{ 'onClick': {} },
    size: "small",
    plain: true,
}));
const __VLS_102 = __VLS_101({
    ...{ 'onClick': {} },
    size: "small",
    plain: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
let __VLS_104;
let __VLS_105;
let __VLS_106;
const __VLS_107 = {
    onClick: (...[$event]) => {
        __VLS_ctx.refreshPlatform('tmall');
    }
};
__VLS_103.slots.default;
const __VLS_108 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({}));
const __VLS_110 = __VLS_109({}, ...__VLS_functionalComponentArgsRest(__VLS_109));
__VLS_111.slots.default;
const __VLS_112 = {}.Refresh;
/** @type {[typeof __VLS_components.Refresh, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({}));
const __VLS_114 = __VLS_113({}, ...__VLS_functionalComponentArgsRest(__VLS_113));
var __VLS_111;
var __VLS_103;
if (__VLS_ctx.tmallData?.summary && Object.keys(__VLS_ctx.tmallData.summary).length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-cards" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.formatNum(__VLS_ctx.tmallData.summary.total_sales));
    if (__VLS_ctx.tmallData.summary.yoy_growth !== null) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-yoy" },
            ...{ class: (__VLS_ctx.tmallData.summary.yoy_growth >= 0 ? 'pos' : 'neg') },
        });
        (__VLS_ctx.tmallData.summary.yoy_growth >= 0 ? '+' : '');
        (__VLS_ctx.tmallData.summary.yoy_growth);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.formatNum(__VLS_ctx.tmallData.summary.total_orders));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.formatNum(__VLS_ctx.tmallData.summary.total_visitors));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.tmallData.summary.avg_conversion);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrapper" },
});
const __VLS_116 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    ...{ 'onSortChange': {} },
    data: ((__VLS_ctx.tmallData?.records || [])),
    size: "small",
    border: true,
    stripe: true,
    maxHeight: (240),
}));
const __VLS_118 = __VLS_117({
    ...{ 'onSortChange': {} },
    data: ((__VLS_ctx.tmallData?.records || [])),
    size: "small",
    border: true,
    stripe: true,
    maxHeight: (240),
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
let __VLS_120;
let __VLS_121;
let __VLS_122;
const __VLS_123 = {
    onSortChange: ((e) => __VLS_ctx.onSortChange(e, 'tmall'))
};
__VLS_119.slots.default;
const __VLS_124 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
    prop: "label",
    label: "期间",
    minWidth: "110",
    sortable: "custom",
    fixed: true,
}));
const __VLS_126 = __VLS_125({
    prop: "label",
    label: "期间",
    minWidth: "110",
    sortable: "custom",
    fixed: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_125));
const __VLS_128 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    prop: "sales_amount",
    label: "销售额(元)",
    minWidth: "120",
    sortable: "custom",
    align: "right",
}));
const __VLS_130 = __VLS_129({
    prop: "sales_amount",
    label: "销售额(元)",
    minWidth: "120",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
__VLS_131.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_131.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "num-cell" },
    });
    (__VLS_ctx.formatNum(row.sales_amount));
}
var __VLS_131;
const __VLS_132 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    prop: "yoy_sales_amount",
    label: "去年同期",
    minWidth: "120",
    align: "right",
}));
const __VLS_134 = __VLS_133({
    prop: "yoy_sales_amount",
    label: "去年同期",
    minWidth: "120",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
__VLS_135.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_135.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (row.yoy_sales_amount !== null) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "num-cell muted" },
        });
        (__VLS_ctx.formatNum(row.yoy_sales_amount));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "muted" },
        });
    }
}
var __VLS_135;
const __VLS_136 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    prop: "yoy_growth",
    label: "同比",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}));
const __VLS_138 = __VLS_137({
    prop: "yoy_growth",
    label: "同比",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
__VLS_139.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_139.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (row.yoy_growth !== null) {
        const __VLS_140 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
            type: (row.yoy_growth >= 0 ? 'success' : 'danger'),
            size: "small",
            effect: "plain",
        }));
        const __VLS_142 = __VLS_141({
            type: (row.yoy_growth >= 0 ? 'success' : 'danger'),
            size: "small",
            effect: "plain",
        }, ...__VLS_functionalComponentArgsRest(__VLS_141));
        __VLS_143.slots.default;
        (row.yoy_growth >= 0 ? '+' : '');
        (row.yoy_growth);
        var __VLS_143;
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "muted" },
        });
    }
}
var __VLS_139;
const __VLS_144 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
    prop: "order_count",
    label: "订单数",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}));
const __VLS_146 = __VLS_145({
    prop: "order_count",
    label: "订单数",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_145));
__VLS_147.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_147.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "num-cell" },
    });
    (__VLS_ctx.formatNum(row.order_count));
}
var __VLS_147;
const __VLS_148 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    prop: "visitor_count",
    label: "访客数",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}));
const __VLS_150 = __VLS_149({
    prop: "visitor_count",
    label: "访客数",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
__VLS_151.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_151.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "num-cell" },
    });
    (__VLS_ctx.formatNum(row.visitor_count));
}
var __VLS_151;
const __VLS_152 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
    prop: "conversion_rate",
    label: "转化率",
    minWidth: "80",
    sortable: "custom",
    align: "right",
}));
const __VLS_154 = __VLS_153({
    prop: "conversion_rate",
    label: "转化率",
    minWidth: "80",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_153));
__VLS_155.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_155.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (row.conversion_rate);
}
var __VLS_155;
const __VLS_156 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    prop: "unit_price",
    label: "客单价",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}));
const __VLS_158 = __VLS_157({
    prop: "unit_price",
    label: "客单价",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
__VLS_159.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_159.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "num-cell" },
    });
    (__VLS_ctx.formatNum(row.unit_price));
}
var __VLS_159;
{
    const { empty: __VLS_thisSlot } = __VLS_119.slots;
    const __VLS_160 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
        description: "暂无天猫数据，请上传 Excel",
        imageSize: (60),
    }));
    const __VLS_162 = __VLS_161({
        description: "暂无天猫数据，请上传 Excel",
        imageSize: (60),
    }, ...__VLS_functionalComponentArgsRest(__VLS_161));
}
var __VLS_119;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "tmallChartRef",
    ...{ class: "chart-container" },
});
/** @type {typeof __VLS_ctx.tmallChartRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "platform-module" },
});
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading.jd) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "module-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "module-title-area" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "platform-badge jd" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "module-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "module-actions" },
});
const __VLS_164 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    ...{ 'onClick': {} },
    size: "small",
    plain: true,
}));
const __VLS_166 = __VLS_165({
    ...{ 'onClick': {} },
    size: "small",
    plain: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
let __VLS_168;
let __VLS_169;
let __VLS_170;
const __VLS_171 = {
    onClick: (...[$event]) => {
        __VLS_ctx.exportTable('jd');
    }
};
__VLS_167.slots.default;
const __VLS_172 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({}));
const __VLS_174 = __VLS_173({}, ...__VLS_functionalComponentArgsRest(__VLS_173));
__VLS_175.slots.default;
const __VLS_176 = {}.Download;
/** @type {[typeof __VLS_components.Download, ]} */ ;
// @ts-ignore
const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({}));
const __VLS_178 = __VLS_177({}, ...__VLS_functionalComponentArgsRest(__VLS_177));
var __VLS_175;
var __VLS_167;
const __VLS_180 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    ...{ 'onClick': {} },
    size: "small",
    plain: true,
}));
const __VLS_182 = __VLS_181({
    ...{ 'onClick': {} },
    size: "small",
    plain: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
let __VLS_184;
let __VLS_185;
let __VLS_186;
const __VLS_187 = {
    onClick: (...[$event]) => {
        __VLS_ctx.refreshPlatform('jd');
    }
};
__VLS_183.slots.default;
const __VLS_188 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({}));
const __VLS_190 = __VLS_189({}, ...__VLS_functionalComponentArgsRest(__VLS_189));
__VLS_191.slots.default;
const __VLS_192 = {}.Refresh;
/** @type {[typeof __VLS_components.Refresh, ]} */ ;
// @ts-ignore
const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({}));
const __VLS_194 = __VLS_193({}, ...__VLS_functionalComponentArgsRest(__VLS_193));
var __VLS_191;
var __VLS_183;
if (__VLS_ctx.jdData?.summary && Object.keys(__VLS_ctx.jdData.summary).length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-cards" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.formatNum(__VLS_ctx.jdData.summary.total_sales));
    if (__VLS_ctx.jdData.summary.yoy_growth !== null) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-yoy" },
            ...{ class: (__VLS_ctx.jdData.summary.yoy_growth >= 0 ? 'pos' : 'neg') },
        });
        (__VLS_ctx.jdData.summary.yoy_growth >= 0 ? '+' : '');
        (__VLS_ctx.jdData.summary.yoy_growth);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.formatNum(__VLS_ctx.jdData.summary.total_orders));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.formatNum(__VLS_ctx.jdData.summary.total_visitors));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.jdData.summary.avg_conversion);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrapper" },
});
const __VLS_196 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    ...{ 'onSortChange': {} },
    data: ((__VLS_ctx.jdData?.records || [])),
    size: "small",
    border: true,
    stripe: true,
    maxHeight: (240),
}));
const __VLS_198 = __VLS_197({
    ...{ 'onSortChange': {} },
    data: ((__VLS_ctx.jdData?.records || [])),
    size: "small",
    border: true,
    stripe: true,
    maxHeight: (240),
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
let __VLS_200;
let __VLS_201;
let __VLS_202;
const __VLS_203 = {
    onSortChange: ((e) => __VLS_ctx.onSortChange(e, 'jd'))
};
__VLS_199.slots.default;
const __VLS_204 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
    prop: "label",
    label: "期间",
    minWidth: "110",
    sortable: "custom",
    fixed: true,
}));
const __VLS_206 = __VLS_205({
    prop: "label",
    label: "期间",
    minWidth: "110",
    sortable: "custom",
    fixed: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
const __VLS_208 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
    prop: "sales_amount",
    label: "销售额(元)",
    minWidth: "120",
    sortable: "custom",
    align: "right",
}));
const __VLS_210 = __VLS_209({
    prop: "sales_amount",
    label: "销售额(元)",
    minWidth: "120",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_209));
__VLS_211.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_211.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "num-cell" },
    });
    (__VLS_ctx.formatNum(row.sales_amount));
}
var __VLS_211;
const __VLS_212 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
    prop: "yoy_sales_amount",
    label: "去年同期",
    minWidth: "120",
    align: "right",
}));
const __VLS_214 = __VLS_213({
    prop: "yoy_sales_amount",
    label: "去年同期",
    minWidth: "120",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_213));
__VLS_215.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_215.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (row.yoy_sales_amount !== null) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "num-cell muted" },
        });
        (__VLS_ctx.formatNum(row.yoy_sales_amount));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "muted" },
        });
    }
}
var __VLS_215;
const __VLS_216 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({
    prop: "yoy_growth",
    label: "同比",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}));
const __VLS_218 = __VLS_217({
    prop: "yoy_growth",
    label: "同比",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_217));
__VLS_219.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_219.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (row.yoy_growth !== null) {
        const __VLS_220 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
            type: (row.yoy_growth >= 0 ? 'success' : 'danger'),
            size: "small",
            effect: "plain",
        }));
        const __VLS_222 = __VLS_221({
            type: (row.yoy_growth >= 0 ? 'success' : 'danger'),
            size: "small",
            effect: "plain",
        }, ...__VLS_functionalComponentArgsRest(__VLS_221));
        __VLS_223.slots.default;
        (row.yoy_growth >= 0 ? '+' : '');
        (row.yoy_growth);
        var __VLS_223;
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "muted" },
        });
    }
}
var __VLS_219;
const __VLS_224 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
    prop: "order_count",
    label: "订单数",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}));
const __VLS_226 = __VLS_225({
    prop: "order_count",
    label: "订单数",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_225));
__VLS_227.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_227.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "num-cell" },
    });
    (__VLS_ctx.formatNum(row.order_count));
}
var __VLS_227;
const __VLS_228 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_229 = __VLS_asFunctionalComponent(__VLS_228, new __VLS_228({
    prop: "visitor_count",
    label: "访客数",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}));
const __VLS_230 = __VLS_229({
    prop: "visitor_count",
    label: "访客数",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_229));
__VLS_231.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_231.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "num-cell" },
    });
    (__VLS_ctx.formatNum(row.visitor_count));
}
var __VLS_231;
const __VLS_232 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
    prop: "conversion_rate",
    label: "转化率",
    minWidth: "80",
    sortable: "custom",
    align: "right",
}));
const __VLS_234 = __VLS_233({
    prop: "conversion_rate",
    label: "转化率",
    minWidth: "80",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_233));
__VLS_235.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_235.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (row.conversion_rate);
}
var __VLS_235;
const __VLS_236 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_237 = __VLS_asFunctionalComponent(__VLS_236, new __VLS_236({
    prop: "unit_price",
    label: "客单价",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}));
const __VLS_238 = __VLS_237({
    prop: "unit_price",
    label: "客单价",
    minWidth: "90",
    sortable: "custom",
    align: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_237));
__VLS_239.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_239.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "num-cell" },
    });
    (__VLS_ctx.formatNum(row.unit_price));
}
var __VLS_239;
{
    const { empty: __VLS_thisSlot } = __VLS_199.slots;
    const __VLS_240 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_241 = __VLS_asFunctionalComponent(__VLS_240, new __VLS_240({
        description: "暂无京东数据，请上传 Excel",
        imageSize: (60),
    }));
    const __VLS_242 = __VLS_241({
        description: "暂无京东数据，请上传 Excel",
        imageSize: (60),
    }, ...__VLS_functionalComponentArgsRest(__VLS_241));
}
var __VLS_199;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "jdChartRef",
    ...{ class: "chart-container" },
});
/** @type {typeof __VLS_ctx.jdChartRef} */ ;
/** @type {__VLS_StyleScopedClasses['data-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-title']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-content']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-area']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-text']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-result']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['period-group']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['date-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['overview-item']} */ ;
/** @type {__VLS_StyleScopedClasses['overview-platform']} */ ;
/** @type {__VLS_StyleScopedClasses['platform-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['overview-sales']} */ ;
/** @type {__VLS_StyleScopedClasses['overview-yoy']} */ ;
/** @type {__VLS_StyleScopedClasses['overview-yoy']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['tips-list']} */ ;
/** @type {__VLS_StyleScopedClasses['main-workspace']} */ ;
/** @type {__VLS_StyleScopedClasses['platforms-container']} */ ;
/** @type {__VLS_StyleScopedClasses['platform-module']} */ ;
/** @type {__VLS_StyleScopedClasses['module-header']} */ ;
/** @type {__VLS_StyleScopedClasses['module-title-area']} */ ;
/** @type {__VLS_StyleScopedClasses['platform-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['tmall']} */ ;
/** @type {__VLS_StyleScopedClasses['module-title']} */ ;
/** @type {__VLS_StyleScopedClasses['module-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-yoy']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['platform-module']} */ ;
/** @type {__VLS_StyleScopedClasses['module-header']} */ ;
/** @type {__VLS_StyleScopedClasses['module-title-area']} */ ;
/** @type {__VLS_StyleScopedClasses['platform-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['jd']} */ ;
/** @type {__VLS_StyleScopedClasses['module-title']} */ ;
/** @type {__VLS_StyleScopedClasses['module-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-yoy']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['num-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            UploadFilled: UploadFilled,
            Download: Download,
            Refresh: Refresh,
            RefreshLeft: RefreshLeft,
            CircleCheckFilled: CircleCheckFilled,
            WarningFilled: WarningFilled,
            periodType: periodType,
            dateRange: dateRange,
            tmallData: tmallData,
            jdData: jdData,
            loading: loading,
            uploadResult: uploadResult,
            uploadError: uploadError,
            tmallChartRef: tmallChartRef,
            jdChartRef: jdChartRef,
            hasData: hasData,
            overviewStats: overviewStats,
            formatNum: formatNum,
            onFilterChange: onFilterChange,
            resetDateRange: resetDateRange,
            refreshPlatform: refreshPlatform,
            handleUpload: handleUpload,
            downloadTemplate: downloadTemplate,
            onSortChange: onSortChange,
            exportTable: exportTable,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
