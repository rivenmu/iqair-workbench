import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
const chartRef = ref(null);
let chartInstance = null;
let debounceTimer = null;
const tabs = [
    { key: 'bilingual', label: '中英双语' },
    { key: 'cn', label: '中文' },
    { key: 'en', label: 'English' },
];
const activeTab = ref('bilingual');
const colorSchemes = {
    natural: {
        colors: {
            100: '#6B2117',
            80: '#930A7B',
            70: '#3F6E86',
            60: '#188863',
            50: '#567F18',
            40: '#9D984F',
        },
        background: '#FFFFFF',
        isDark: false,
    },
    vivid: {
        colors: {
            100: '#8B2E2E',
            80: '#6B8E23',
            70: '#9932CC',
            60: '#1E90FF',
            50: '#2E8B57',
            40: '#333333',
        },
        background: '#FFFFFF',
        isDark: false,
    },
    bright: {
        colors: {
            100: '#8B2E2E',
            80: '#6B8E23',
            70: '#9932CC',
            60: '#4A7C8C',
            50: '#2E8B57',
            40: '#333333',
        },
        background: '#FFFFFF',
        isDark: false,
    },
    vintage: {
        colors: {
            100: '#5D2E2E',
            80: '#7B3F61',
            70: '#1A4F4A',
            60: '#5A6E2B',
            50: '#5B6C7D',
            40: '#B8863B',
        },
        background: '#FFFFFF',
        isDark: false,
    },
    morandi: {
        colors: {
            100: '#5A6B7D',
            80: '#7B9B8B',
            70: '#A78B9F',
            60: '#C9A895',
            50: '#9CAFB5',
            40: '#D4C9B8',
        },
        background: '#FDFBF7',
        isDark: false,
    },
};
const schemeLabels = {
    bright: '明亮色',
    morandi: '莫兰迪',
    natural: '自然色',
    vivid: '鲜明色',
    vintage: '复古色',
};
const activeScheme = ref('bright');
const currentScheme = computed(() => colorSchemes[activeScheme.value]);
const colorMap = computed(() => currentScheme.value.colors);
const schemeBackground = computed(() => currentScheme.value.background);
const isDarkScheme = computed(() => currentScheme.value.isDark);
const expandedGroups = ref([100]);
const fontWeightMap = {
    100: 500,
    80: 400,
    70: 400,
    60: 400,
    50: 300,
    40: 300,
};
const STORAGE_KEY = 'ciyun_word_items';
const defaultWordItems = [
    { cn: '噪音大', en: 'Too Noisy', value: 100 },
    { cn: '差评', en: 'Bad Reviews', value: 100 },
    { cn: '不推荐购买', en: 'Not Recommended', value: 100 },
    { cn: '价格贵', en: 'Overpriced', value: 80 },
    { cn: '吸毛效果差', en: 'Poor Pet Hair Pickup', value: 70 },
    { cn: '效果不明显', en: 'Barely Effective', value: 80 },
    { cn: '异响', en: 'Abnormal Noise', value: 70 },
    { cn: '偏大', en: 'Oversized', value: 60 },
    { cn: '偏小', en: 'Undersized', value: 50 },
    { cn: '质量差', en: 'Low Quality', value: 60 },
    { cn: '效果差', en: 'Poor Results', value: 50 },
    { cn: '异味', en: 'Bad Smell', value: 60 },
    { cn: '过滤效果差', en: 'Weak Filtration', value: 50 },
    { cn: '耗电高', en: 'Power Hungry', value: 60 },
    { cn: '服务差', en: 'Bad Service', value: 50 },
    { cn: '声音大', en: 'Too Loud', value: 60 },
    { cn: '占用空间大', en: 'Too Bulky', value: 50 },
    { cn: '物流慢', en: 'Slow Shipping', value: 60 },
    { cn: '尺寸大', en: 'Too Big', value: 50 },
    { cn: '客服差', en: 'Rude Support', value: 60 },
    { cn: '价格不稳定', en: 'Price Unstable', value: 50 },
    { cn: '清洁不彻底', en: 'Half Cleaned', value: 60 },
    { cn: '去味效果差', en: 'Lingering Odor', value: 50 },
    { cn: '退货问题', en: 'Return Hassle', value: 60 },
    { cn: '风力弱', en: 'Weak Wind', value: 50 },
    { cn: '物流服务差', en: 'Bad Logistics', value: 60 },
    { cn: '功率小', en: 'Low Wattage', value: 50 },
    { cn: '覆盖范围小', en: 'Short Reach', value: 60 },
    { cn: '耗材贵', en: 'Pricey Filters', value: 50 },
    { cn: '态度差', en: 'Rude Staff', value: 60 },
    { cn: '性能下降', en: 'Slowing Down', value: 50 },
    { cn: '性价比低', en: 'Poor Value', value: 60 },
    { cn: '无保价', en: 'No Price Match', value: 50 },
    { cn: '不满意', en: 'Disappointing', value: 60 },
    { cn: '甲醛问题', en: 'Formaldehyde Risk', value: 50 },
    { cn: '外观一般', en: 'Ugly Design', value: 60 },
    { cn: '降价快', en: 'Price Drops Fast', value: 50 },
    { cn: '售后差', en: 'Bad After-Sales', value: 60 },
    { cn: '无遥控器', en: 'No Remote', value: 50 },
    { cn: '效果一般', en: 'Just Okay', value: 60 },
    { cn: '偏重', en: 'Too Heavy', value: 50 },
    { cn: '浪费', en: 'A Waste', value: 60 },
    { cn: '购物差评', en: 'Regret Purchase', value: 50 },
    { cn: '不退货', en: 'No Returns', value: 60 },
    { cn: '容量小', en: 'Too Small', value: 50 },
    { cn: '不完整', en: 'Missing Parts', value: 60 },
    { cn: '包装破损', en: 'Damaged Box', value: 50 },
    { cn: '不实用', en: 'Useless', value: 60 },
    { cn: '吸附效果差', en: 'Weak Suction', value: 50 },
    { cn: '滤芯贵', en: 'Costly Filters', value: 60 },
    { cn: '试用限制', en: 'Trial Locked', value: 50 },
    { cn: '不可退货', en: 'Final Sale', value: 60 },
    { cn: '吸尘效果一般', en: 'So-So Suction', value: 50 },
    { cn: '不耐用', en: 'Short-Lived', value: 60 },
    { cn: '配送差', en: 'Rough Delivery', value: 50 },
    { cn: '去甲醛效果慢', en: 'Slow Purifying', value: 60 },
    { cn: '尺寸偏高', en: 'Too Tall', value: 50 },
    { cn: '质感差', en: 'Cheap Feel', value: 60 },
    { cn: '烟味', en: 'Smoky Smell', value: 50 },
    { cn: '异味偏重', en: 'Strong Stench', value: 60 },
    { cn: '噪声', en: 'Noisy', value: 50 },
    { cn: '设计差', en: 'Ugly', value: 60 },
    { cn: '有声音', en: 'Rattling', value: 50 },
    { cn: '瑕疵', en: 'Flawed', value: 60 },
    { cn: '轻微', en: 'Trivial', value: 50 },
    { cn: '无除臭功能', en: 'No Deodorizer', value: 40 },
    { cn: '不吸猫毛', en: 'Skips Cat Hair', value: 40 },
    { cn: '回答不准确', en: 'Wrong Answers', value: 40 },
    { cn: '保修', en: 'Warranty', value: 40 },
    { cn: '防骗提醒', en: 'Fraud Alert', value: 40 },
    { cn: '不保价', en: 'No Guarantee', value: 40 },
    { cn: '不一致', en: 'Inconsistent', value: 40 },
    { cn: '不爽', en: 'Annoying', value: 40 },
    { cn: '滤网脏', en: 'Grimy Filter', value: 40 },
    { cn: '无用', en: 'Pointless', value: 40 },
    { cn: '一般', en: 'Mediocre', value: 40 },
    { cn: '价格偏贵', en: 'A Bit Pricey', value: 40 },
    { cn: '欺诈行为', en: 'Scammy', value: 40 },
    { cn: '有味', en: 'Smelly', value: 40 },
    { cn: '无法评价', en: "Can't Judge", value: 40 },
    { cn: '不方便', en: 'Clunky', value: 40 },
    { cn: '不好', en: 'Bad', value: 40 },
    { cn: '不安全', en: 'Unsafe', value: 40 },
    { cn: '无轮子', en: 'No Wheels', value: 40 },
    { cn: '不舒服', en: 'Uncomfy', value: 40 },
    { cn: '恶劣体验', en: 'Horrible', value: 40 },
    { cn: '沟通问题', en: 'Poor Comms', value: 40 },
    { cn: '风机问题', en: 'Fan Failure', value: 40 },
    { cn: '假货', en: 'Counterfeit', value: 40 },
    { cn: '配送问题', en: 'Ship Issues', value: 40 },
    { cn: '恶臭', en: 'Stinks', value: 40 },
    { cn: '降价', en: 'Markdown', value: 40 },
];
function loadSavedWords() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    }
    catch (e) {
        console.warn('Failed to load saved words:', e);
    }
    return JSON.parse(JSON.stringify(defaultWordItems));
}
const wordItems = ref(loadSavedWords());
const hasChanges = ref(false);
let savedSnapshot = JSON.stringify(wordItems.value);
function getWordsByWeight(weight) {
    return wordItems.value.filter((item) => item.value === weight);
}
function toggleGroup(weight) {
    const idx = expandedGroups.value.indexOf(weight);
    if (idx > -1) {
        expandedGroups.value.splice(idx, 1);
    }
    else {
        expandedGroups.value.push(weight);
    }
}
function onWordChange() {
    hasChanges.value = JSON.stringify(wordItems.value) !== savedSnapshot;
    if (debounceTimer)
        clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        nextTick(() => renderChart(activeTab.value));
    }, 300);
}
function saveWords() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wordItems.value));
        savedSnapshot = JSON.stringify(wordItems.value);
        hasChanges.value = false;
        nextTick(() => renderChart(activeTab.value));
    }
    catch (e) {
        console.error('Failed to save words:', e);
    }
}
function refreshChart() {
    nextTick(() => renderChart(activeTab.value));
}
function buildChartData(tab) {
    return wordItems.value.map((item) => {
        let name;
        if (tab === 'cn') {
            name = item.cn;
        }
        else if (tab === 'bilingual') {
            name = `${item.cn} / ${item.en}`;
        }
        else {
            name = item.en;
        }
        return {
            name,
            value: item.value,
            textStyle: {
                color: colorMap.value[item.value] || '#999',
                fontWeight: fontWeightMap[item.value] || 400,
            },
        };
    });
}
function getBaseOption(data, tab) {
    const fontFamily = tab === 'en'
        ? 'Inter, Arial, sans-serif'
        : "'Noto Sans SC', 'Microsoft YaHei', sans-serif";
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
    };
}
function renderChart(tab) {
    if (!chartInstance)
        return;
    const data = buildChartData(tab);
    chartInstance.setOption(getBaseOption(data, tab), true);
}
function switchTab(key) {
    if (activeTab.value === key)
        return;
    activeTab.value = key;
    nextTick(() => renderChart(activeTab.value));
}
function selectScheme(key) {
    if (activeScheme.value === key)
        return;
    activeScheme.value = key;
    nextTick(() => renderChart(activeTab.value));
}
function initChart() {
    if (!chartRef.value)
        return;
    chartInstance = echarts.init(chartRef.value);
    renderChart(activeTab.value);
}
function handleResize() {
    chartInstance?.resize();
}
onMounted(() => {
    initChart();
    window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    chartInstance?.dispose();
    if (debounceTimer)
        clearTimeout(debounceTimer);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['lang-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-page']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-main']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-card']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-title']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['lang-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['lang-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['scheme-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['keyword-list']} */ ;
/** @type {__VLS_StyleScopedClasses['group-header']} */ ;
/** @type {__VLS_StyleScopedClasses['group-count']} */ ;
/** @type {__VLS_StyleScopedClasses['group-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['keyword-input']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "ciyun-page" },
    ...{ class: ({ 'dark-mode': __VLS_ctx.isDarkScheme }) },
    ...{ style: ({ background: __VLS_ctx.schemeBackground }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "ciyun-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "12",
    cy: "12",
    r: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "6",
    cy: "12",
    r: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "18",
    cy: "12",
    r: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "12",
    cy: "6",
    r: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "12",
    cy: "18",
    r: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "18",
    cy: "6",
    r: "1",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "6",
    cy: "18",
    r: "1",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "18",
    cy: "18",
    r: "1",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "6",
    cy: "6",
    r: "1",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "sidebar-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "sidebar-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "lang-menu" },
});
for (const [tab] of __VLS_getVForSourceType((__VLS_ctx.tabs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchTab(tab.key);
            } },
        key: (tab.key),
        ...{ class: (['lang-item', { active: __VLS_ctx.activeTab === tab.key }]) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "lang-dot" },
    });
    (tab.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "scheme-group" },
});
for (const [label, key] of __VLS_getVForSourceType((__VLS_ctx.schemeLabels))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectScheme(key);
            } },
        key: (key),
        ...{ class: (['scheme-item', { active: __VLS_ctx.activeScheme === key }]) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "scheme-dot" },
        ...{ class: (key) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "scheme-name" },
    });
    (label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-section keyword-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.saveWords) },
    ...{ class: "action-btn save-btn" },
    disabled: (!__VLS_ctx.hasChanges),
    title: "保存修改",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "17 21 17 13 7 13 7 21",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "7 3 7 8 15 8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.refreshChart) },
    ...{ class: "action-btn refresh-btn" },
    title: "刷新词云",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M3 3v5h5",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M16 21h5v-5",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "keyword-list" },
});
for (const [weight] of __VLS_getVForSourceType(([100, 80, 70, 60, 50, 40]))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (weight),
        ...{ class: "keyword-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toggleGroup(weight);
            } },
        ...{ class: "group-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "group-swatch" },
        ...{ style: ({ background: __VLS_ctx.colorMap[weight] }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "group-label" },
    });
    (weight);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "group-count" },
    });
    (__VLS_ctx.getWordsByWeight(weight).length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "group-arrow" },
        ...{ class: ({ expanded: __VLS_ctx.expandedGroups.includes(weight) }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        width: "12",
        height: "12",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
        points: "6 9 12 15 18 9",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "group-items" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.expandedGroups.includes(weight)) }, null, null);
    for (const [word, idx] of __VLS_getVForSourceType((__VLS_ctx.getWordsByWeight(weight)))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (idx),
            ...{ class: "keyword-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onInput: (__VLS_ctx.onWordChange) },
            ...{ class: "keyword-input cn-input" },
            placeholder: "中文",
        });
        (word.cn);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onInput: (__VLS_ctx.onWordChange) },
            ...{ class: "keyword-input en-input" },
            placeholder: "English",
        });
        (word.en);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-footer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "color-legend" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "legend-list" },
});
for (const [weight] of __VLS_getVForSourceType(([100, 80, 70, 60, 50, 40]))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (weight),
        ...{ class: "legend-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "legend-swatch" },
        ...{ style: ({ background: __VLS_ctx.colorMap[weight] }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "legend-label" },
    });
    (weight);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "ciyun-main" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dashboard-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "chartRef",
    ...{ class: "ciyun-chart" },
});
/** @type {typeof __VLS_ctx.chartRef} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-page']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-title']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['lang-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['lang-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['scheme-group']} */ ;
/** @type {__VLS_StyleScopedClasses['scheme-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['scheme-name']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-section']} */ ;
/** @type {__VLS_StyleScopedClasses['keyword-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['section-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['keyword-list']} */ ;
/** @type {__VLS_StyleScopedClasses['keyword-group']} */ ;
/** @type {__VLS_StyleScopedClasses['group-header']} */ ;
/** @type {__VLS_StyleScopedClasses['group-swatch']} */ ;
/** @type {__VLS_StyleScopedClasses['group-label']} */ ;
/** @type {__VLS_StyleScopedClasses['group-count']} */ ;
/** @type {__VLS_StyleScopedClasses['group-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['group-items']} */ ;
/** @type {__VLS_StyleScopedClasses['keyword-item']} */ ;
/** @type {__VLS_StyleScopedClasses['keyword-input']} */ ;
/** @type {__VLS_StyleScopedClasses['cn-input']} */ ;
/** @type {__VLS_StyleScopedClasses['keyword-input']} */ ;
/** @type {__VLS_StyleScopedClasses['en-input']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['color-legend']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-list']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-swatch']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-main']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-card']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-chart']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            chartRef: chartRef,
            tabs: tabs,
            activeTab: activeTab,
            schemeLabels: schemeLabels,
            activeScheme: activeScheme,
            colorMap: colorMap,
            schemeBackground: schemeBackground,
            isDarkScheme: isDarkScheme,
            expandedGroups: expandedGroups,
            hasChanges: hasChanges,
            getWordsByWeight: getWordsByWeight,
            toggleGroup: toggleGroup,
            onWordChange: onWordChange,
            saveWords: saveWords,
            refreshChart: refreshChart,
            switchTab: switchTab,
            selectScheme: selectScheme,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
