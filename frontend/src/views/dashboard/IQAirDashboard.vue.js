import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Camera, Clock } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import MainLayout from '@/layouts/MainLayout.vue';
import { dashboardApi } from '@/api/dashboard';
import dayjs from 'dayjs';
const route = useRoute();
const chartRef = ref();
let chartInstance = null;
const loading = ref(false);
const isEditMode = ref(false);
const projectId = ref(1);
const brands = ref([]);
const periods = ref([]);
const snapshots = ref([]);
const uiTexts = reactive({
    sidebarTitle: '配置面板',
    sidebarSub: 'v3.0',
    mainTitle: '核心品牌滤芯营收及占比演变',
    mainDesc: '提示：数据根据最新期间滤芯销售额降序排列'
});
const snapshotDialogVisible = ref(false);
const showHistoryDialog = ref(false);
const snapshotNote = ref('');
const snapshotting = ref(false);
function formatNum(num) {
    return Math.round(num).toLocaleString('zh-CN');
}
function formatDate(date) {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}
async function fetchData() {
    loading.value = true;
    try {
        const data = await dashboardApi.getData(projectId.value);
        periods.value = data.periods || [];
        brands.value = data.brands || [];
        await nextTick();
        renderChart();
    }
    catch (error) {
        // 错误已在拦截器处理
    }
    finally {
        loading.value = false;
    }
}
async function fetchSnapshots() {
    try {
        const data = await dashboardApi.getSnapshots(projectId.value);
        snapshots.value = Array.isArray(data) ? data : [];
    }
    catch (error) {
        snapshots.value = [];
    }
}
function renderChart() {
    if (!chartRef.value)
        return;
    if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value);
    }
    const seriesData = [];
    brands.value.forEach((brand) => {
        const isIQAir = brand.name === 'IQAir';
        const barColor = isIQAir ? '#D32F2F' : brand.color;
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
        });
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
        });
    });
    const option = {
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
                axisLabel: { color: '#86868B', fontSize: 11, formatter: (val) => val.toLocaleString('zh-CN') }
            },
            {
                type: 'value',
                name: '占比 (%)',
                splitLine: { show: false },
                axisLabel: { color: '#86868B', fontSize: 11, formatter: '{value}%' }
            }
        ],
        series: seriesData
    };
    chartInstance.setOption(option, true);
}
function toggleEditMode() {
    if (isEditMode.value) {
        // 退出编辑，保存数据
        saveData();
    }
    isEditMode.value = !isEditMode.value;
}
async function saveData() {
    try {
        // 按最新期间降序排列
        const lastIdx = periods.value.length - 1;
        brands.value.sort((a, b) => b.filterRev[lastIdx] - a.filterRev[lastIdx]);
        await dashboardApi.saveData(projectId.value, {
            periods: periods.value,
            brands: brands.value
        });
        ElMessage.success('数据保存成功');
        renderChart();
        fetchSnapshots();
    }
    catch (error) {
        // 错误已在拦截器处理
    }
}
function handleDataChange(event, bIdx, yIdx, type) {
    const val = parseFloat(event.target.innerText.replace(/,/g, '').replace('%', '').trim());
    if (isNaN(val))
        return;
    if (type === 'rev') {
        brands.value[bIdx].filterRev[yIdx] = val;
    }
    else {
        brands.value[bIdx].filterPct[yIdx] = val;
    }
}
async function handleLogoUpload(file, brandIndex) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        brands.value[brandIndex].logo = e.target?.result;
        renderChart();
        await saveData();
    };
    reader.readAsDataURL(file);
    return false;
}
function openSnapshotDialog() {
    snapshotNote.value = '';
    snapshotDialogVisible.value = true;
}
async function handleCreateSnapshot() {
    snapshotting.value = true;
    try {
        await dashboardApi.createSnapshot(projectId.value, { note: snapshotNote.value });
        ElMessage.success('快照保存成功');
        snapshotDialogVisible.value = false;
        fetchSnapshots();
    }
    catch (error) {
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
        await dashboardApi.restoreSnapshot(projectId.value, snapshotId);
        ElMessage.success('恢复成功');
        showHistoryDialog.value = false;
        fetchData();
        fetchSnapshots();
    }
    catch (error) {
        // 用户取消或错误
    }
}
function handleResize() {
    chartInstance?.resize();
}
onMounted(() => {
    // 从路由参数获取 projectId
    if (route.params.projectId) {
        projectId.value = parseInt(route.params.projectId);
    }
    fetchData();
    fetchSnapshots();
    window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    chartInstance?.dispose();
});
watch(showHistoryDialog, (val) => {
    if (val)
        fetchSnapshots();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof MainLayout, typeof MainLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(MainLayout, new MainLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "iqair-dashboard" },
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
(__VLS_ctx.uiTexts.sidebarSub || 'v3.0');
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
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "brand-name" },
        ...{ style: ({ color: brand.name === 'IQAir' ? '#D32F2F' : '#334155' }) },
    });
    (brand.name);
    const __VLS_4 = {}.ElUpload;
    /** @type {[typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        showFileList: (false),
        beforeUpload: ((file) => __VLS_ctx.handleLogoUpload(file, idx)),
        accept: "image/*",
    }));
    const __VLS_6 = __VLS_5({
        showFileList: (false),
        beforeUpload: ((file) => __VLS_ctx.handleLogoUpload(file, idx)),
        accept: "image/*",
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    const __VLS_8 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        size: "small",
        type: (brand.logo ? 'success' : 'default'),
    }));
    const __VLS_10 = __VLS_9({
        size: "small",
        type: (brand.logo ? 'success' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    (brand.logo ? '已上传' : '上传 Logo');
    var __VLS_11;
    var __VLS_7;
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
const __VLS_12 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    type: (__VLS_ctx.isEditMode ? 'success' : 'primary'),
    ...{ class: "edit-toggle-btn" },
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    type: (__VLS_ctx.isEditMode ? 'success' : 'primary'),
    ...{ class: "edit-toggle-btn" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.toggleEditMode)
};
__VLS_15.slots.default;
(__VLS_ctx.isEditMode ? '保存修改' : '进入编辑模式');
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-title" },
});
const __VLS_20 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
}));
const __VLS_22 = __VLS_21({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onClick: (__VLS_ctx.openSnapshotDialog)
};
__VLS_23.slots.default;
const __VLS_28 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({}));
const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.Camera;
/** @type {[typeof __VLS_components.Camera, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({}));
const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
var __VLS_31;
var __VLS_23;
const __VLS_36 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
}));
const __VLS_38 = __VLS_37({
    ...{ 'onClick': {} },
    ...{ class: "action-btn" },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_40;
let __VLS_41;
let __VLS_42;
const __VLS_43 = {
    onClick: (...[$event]) => {
        __VLS_ctx.showHistoryDialog = true;
    }
};
__VLS_39.slots.default;
const __VLS_44 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({}));
const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.Clock;
/** @type {[typeof __VLS_components.Clock, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({}));
const __VLS_50 = __VLS_49({}, ...__VLS_functionalComponentArgsRest(__VLS_49));
var __VLS_47;
var __VLS_39;
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
(__VLS_ctx.uiTexts.mainTitle || '核心品牌滤芯营收及占比演变');
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "mode-tag" },
    ...{ class: (__VLS_ctx.isEditMode ? 'edit-mode' : 'view-mode') },
});
(__VLS_ctx.isEditMode ? '正在编辑' : '只读预览');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "main-desc" },
});
(__VLS_ctx.uiTexts.mainDesc || '提示：数据根据最新期间滤芯销售额降序排列');
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
for (const [period, idx] of __VLS_getVForSourceType((__VLS_ctx.periods))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        key: (idx),
        colspan: "2",
    });
    (period);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
for (const [period, idx] of __VLS_getVForSourceType((__VLS_ctx.periods))) {
    (idx);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "sub-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({
        ...{ class: "sub-header" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
for (const [brand, bIdx] of __VLS_getVForSourceType((__VLS_ctx.brands))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        key: (bIdx),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "brand-col" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "brand-cell" },
    });
    if (brand.logo) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (brand.logo),
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
        ...{ style: ({ color: brand.name === 'IQAir' ? '#D32F2F' : brand.color }) },
    });
    (brand.name);
    for (const [period, yIdx] of __VLS_getVForSourceType((__VLS_ctx.periods))) {
        (yIdx);
        if (__VLS_ctx.isEditMode) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ onInput: (...[$event]) => {
                        if (!(__VLS_ctx.isEditMode))
                            return;
                        __VLS_ctx.handleDataChange($event, bIdx, yIdx, 'rev');
                    } },
                contenteditable: "true",
                ...{ class: "editing-cell" },
            });
            (__VLS_ctx.formatNum(brand.filterRev[yIdx]));
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.formatNum(brand.filterRev[yIdx]));
        }
        if (__VLS_ctx.isEditMode) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                ...{ onInput: (...[$event]) => {
                        if (!(__VLS_ctx.isEditMode))
                            return;
                        __VLS_ctx.handleDataChange($event, bIdx, yIdx, 'pct');
                    } },
                contenteditable: "true",
                ...{ class: "editing-cell" },
            });
            (brand.filterPct[yIdx]);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (brand.filterPct[yIdx]);
        }
    }
}
const __VLS_52 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.snapshotDialogVisible),
    title: "保存快照",
    width: "440px",
}));
const __VLS_54 = __VLS_53({
    modelValue: (__VLS_ctx.snapshotDialogVisible),
    title: "保存快照",
    width: "440px",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({}));
const __VLS_58 = __VLS_57({}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    label: "备注",
}));
const __VLS_62 = __VLS_61({
    label: "备注",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    modelValue: (__VLS_ctx.snapshotNote),
    type: "textarea",
    rows: (3),
    placeholder: "可选：快照备注说明",
}));
const __VLS_66 = __VLS_65({
    modelValue: (__VLS_ctx.snapshotNote),
    type: "textarea",
    rows: (3),
    placeholder: "可选：快照备注说明",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
var __VLS_63;
var __VLS_59;
{
    const { footer: __VLS_thisSlot } = __VLS_55.slots;
    const __VLS_68 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        ...{ 'onClick': {} },
    }));
    const __VLS_70 = __VLS_69({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    let __VLS_72;
    let __VLS_73;
    let __VLS_74;
    const __VLS_75 = {
        onClick: (...[$event]) => {
            __VLS_ctx.snapshotDialogVisible = false;
        }
    };
    __VLS_71.slots.default;
    var __VLS_71;
    const __VLS_76 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.snapshotting),
    }));
    const __VLS_78 = __VLS_77({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.snapshotting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    let __VLS_80;
    let __VLS_81;
    let __VLS_82;
    const __VLS_83 = {
        onClick: (__VLS_ctx.handleCreateSnapshot)
    };
    __VLS_79.slots.default;
    var __VLS_79;
}
var __VLS_55;
const __VLS_84 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    modelValue: (__VLS_ctx.showHistoryDialog),
    title: "操作历史",
    width: "700px",
}));
const __VLS_86 = __VLS_85({
    modelValue: (__VLS_ctx.showHistoryDialog),
    title: "操作历史",
    width: "700px",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
__VLS_87.slots.default;
const __VLS_88 = {}.ElTimeline;
/** @type {[typeof __VLS_components.ElTimeline, typeof __VLS_components.elTimeline, typeof __VLS_components.ElTimeline, typeof __VLS_components.elTimeline, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({}));
const __VLS_90 = __VLS_89({}, ...__VLS_functionalComponentArgsRest(__VLS_89));
__VLS_91.slots.default;
for (const [snap] of __VLS_getVForSourceType((__VLS_ctx.snapshots))) {
    const __VLS_92 = {}.ElTimelineItem;
    /** @type {[typeof __VLS_components.ElTimelineItem, typeof __VLS_components.elTimelineItem, typeof __VLS_components.ElTimelineItem, typeof __VLS_components.elTimelineItem, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        key: (snap.id),
        timestamp: (__VLS_ctx.formatDate(snap.timestamp)),
        type: (snap.operation_type === 'restore' ? 'warning' : 'primary'),
    }));
    const __VLS_94 = __VLS_93({
        key: (snap.id),
        timestamp: (__VLS_ctx.formatDate(snap.timestamp)),
        type: (snap.operation_type === 'restore' ? 'warning' : 'primary'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    __VLS_95.slots.default;
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
    const __VLS_96 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        size: "small",
        type: (snap.is_manual ? 'success' : 'info'),
    }));
    const __VLS_98 = __VLS_97({
        size: "small",
        type: (snap.is_manual ? 'success' : 'info'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    __VLS_99.slots.default;
    (snap.is_manual ? '手动' : '自动');
    var __VLS_99;
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
        const __VLS_100 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
            ...{ 'onClick': {} },
            size: "small",
            type: "warning",
        }));
        const __VLS_102 = __VLS_101({
            ...{ 'onClick': {} },
            size: "small",
            type: "warning",
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        let __VLS_104;
        let __VLS_105;
        let __VLS_106;
        const __VLS_107 = {
            onClick: (...[$event]) => {
                if (!(snap.operation_type !== 'restore'))
                    return;
                __VLS_ctx.handleRestore(snap.id);
            }
        };
        __VLS_103.slots.default;
        var __VLS_103;
    }
    var __VLS_95;
}
var __VLS_91;
var __VLS_87;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['iqair-dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-title']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-content']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-list']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-row']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-name']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-toggle-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['main-workspace']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-card']} */ ;
/** @type {__VLS_StyleScopedClasses['header-section']} */ ;
/** @type {__VLS_StyleScopedClasses['main-title']} */ ;
/** @type {__VLS_StyleScopedClasses['mode-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['main-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['table-section']} */ ;
/** @type {__VLS_StyleScopedClasses['data-table']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-col']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sub-header']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-col']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['editing-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['editing-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['history-item']} */ ;
/** @type {__VLS_StyleScopedClasses['history-header']} */ ;
/** @type {__VLS_StyleScopedClasses['history-action']} */ ;
/** @type {__VLS_StyleScopedClasses['history-note']} */ ;
/** @type {__VLS_StyleScopedClasses['history-user']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Camera: Camera,
            Clock: Clock,
            MainLayout: MainLayout,
            chartRef: chartRef,
            isEditMode: isEditMode,
            brands: brands,
            periods: periods,
            snapshots: snapshots,
            uiTexts: uiTexts,
            snapshotDialogVisible: snapshotDialogVisible,
            showHistoryDialog: showHistoryDialog,
            snapshotNote: snapshotNote,
            snapshotting: snapshotting,
            formatNum: formatNum,
            formatDate: formatDate,
            toggleEditMode: toggleEditMode,
            handleDataChange: handleDataChange,
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
