import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
// @ts-ignore
import 'echarts-wordcloud';
const chartRef = ref(null);
let chartInstance = null;
const wordCloudData = [
    { name: '噪音大', value: 100 },
    { name: '差评', value: 100 },
    { name: '不推荐购买', value: 100 },
    { name: '价格贵', value: 80 },
    { name: '吸毛效果差', value: 80 },
    { name: '效果不明显', value: 80 },
    { name: '异响', value: 80 },
    { name: '偏大', value: 60 },
    { name: '偏小', value: 60 },
    { name: '质量差', value: 60 },
    { name: '效果差', value: 60 },
    { name: '异味', value: 60 },
    { name: '过滤效果差', value: 60 },
    { name: '耗电高', value: 60 },
    { name: '服务差', value: 60 },
    { name: '声音大', value: 60 },
    { name: '占用空间大', value: 60 },
    { name: '物流慢', value: 60 },
    { name: '尺寸大', value: 60 },
    { name: '客服差', value: 60 },
    { name: '价格不稳定', value: 60 },
    { name: '清洁不彻底', value: 60 },
    { name: '去味效果差', value: 60 },
    { name: '退货问题', value: 60 },
    { name: '风力弱', value: 60 },
    { name: '物流服务差', value: 60 },
    { name: '功率小', value: 60 },
    { name: '覆盖范围小', value: 60 },
    { name: '耗材贵', value: 60 },
    { name: '态度差', value: 60 },
    { name: '性能下降', value: 60 },
    { name: '性价比低', value: 60 },
    { name: '无保价', value: 60 },
    { name: '不满意', value: 60 },
    { name: '甲醛问题', value: 60 },
    { name: '外观一般', value: 60 },
    { name: '降价快', value: 60 },
    { name: '售后差', value: 60 },
    { name: '无遥控器', value: 60 },
    { name: '效果一般', value: 60 },
    { name: '偏重', value: 60 },
    { name: '浪费', value: 60 },
    { name: '购物差评', value: 60 },
    { name: '不退货', value: 60 },
    { name: '容量小', value: 60 },
    { name: '不完整', value: 60 },
    { name: '包装破损', value: 60 },
    { name: '不实用', value: 60 },
    { name: '吸附效果差', value: 60 },
    { name: '滤芯贵', value: 60 },
    { name: '试用限制', value: 60 },
    { name: '不可退货', value: 60 },
    { name: '吸尘效果一般', value: 60 },
    { name: '不耐用', value: 60 },
    { name: '配送差', value: 60 },
    { name: '去甲醛效果慢', value: 60 },
    { name: '尺寸偏高', value: 60 },
    { name: '质感差', value: 60 },
    { name: '烟味', value: 60 },
    { name: '异味偏重', value: 60 },
    { name: '噪声', value: 60 },
    { name: '设计差', value: 60 },
    { name: '有声音', value: 60 },
    { name: '瑕疵', value: 60 },
    { name: '轻微', value: 60 },
    { name: '无除臭功能', value: 40 },
    { name: '不吸猫毛', value: 40 },
    { name: '回答不准确', value: 40 },
    { name: '保修', value: 40 },
    { name: '防骗提醒', value: 40 },
    { name: '不保价', value: 40 },
    { name: '不一致', value: 40 },
    { name: '不爽', value: 40 },
    { name: '滤网脏', value: 40 },
    { name: '无用', value: 40 },
    { name: '一般', value: 40 },
    { name: '价格偏贵', value: 40 },
    { name: '欺诈行为', value: 40 },
    { name: '有味', value: 40 },
    { name: '无法评价', value: 40 },
    { name: '不方便', value: 40 },
    { name: '不好', value: 40 },
    { name: '不安全', value: 40 },
    { name: '无轮子', value: 40 },
    { name: '不舒服', value: 40 },
    { name: '恶劣体验', value: 40 },
    { name: '沟通问题', value: 40 },
    { name: '风机问题', value: 40 },
    { name: '假货', value: 40 },
    { name: '配送问题', value: 40 },
    { name: '恶臭', value: 40 },
    { name: '降价', value: 40 },
];
function initChart() {
    if (!chartRef.value)
        return;
    chartInstance = echarts.init(chartRef.value);
    const option = {
        backgroundColor: '#FFFFFF',
        series: [
            {
                type: 'wordCloud',
                gridSize: 8,
                sizeRange: [12, 48],
                rotationRange: [0, 0],
                rotationStep: 0,
                shape: 'rect',
                drawOutOfBound: false,
                textStyle: {
                    fontFamily: 'Microsoft YaHei',
                    fontWeight: 'normal',
                    color: '#9f5749',
                },
                emphasis: {
                    focus: 'self',
                    textStyle: {
                        color: '#9f5749',
                    },
                },
                data: wordCloudData,
            },
        ],
    };
    chartInstance.setOption(option);
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
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "ciyun-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "ciyun-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "ciyun-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "chartRef",
    ...{ class: "ciyun-chart" },
});
/** @type {typeof __VLS_ctx.chartRef} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-page']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-header']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-title']} */ ;
/** @type {__VLS_StyleScopedClasses['ciyun-chart']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            chartRef: chartRef,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
