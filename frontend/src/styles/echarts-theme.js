// ============================================
// ECharts Theme - Unified palette and default config
// ============================================
export const CHART_COLORS = [
    '#4F46E5', // indigo
    '#0891B2', // cyan
    '#EA580C', // orange
    '#059669', // emerald
    '#DC2626', // red
    '#2563EB', // blue
    '#7C3AED', // violet
    '#D97706', // amber
    '#65A30D', // lime
    '#DB2777', // pink
];
export const chartBaseOptions = {
    color: CHART_COLORS,
    animation: true,
    animationDuration: 400,
    animationEasing: 'cubicOut',
    textStyle: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif",
        fontSize: 12,
    },
    grid: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
        containLabel: true,
    },
    tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(0, 0, 0, 0.06)',
        borderWidth: 1,
        textStyle: {
            color: '#1C1C1E',
            fontSize: 13,
        },
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        extraCssText: 'border-radius: 10px; padding: 8px 12px;',
    },
    legend: {
        textStyle: {
            color: '#86868B',
            fontSize: 12,
        },
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 24,
    },
    xAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
            color: '#86868B',
            fontSize: 11,
        },
        splitLine: { show: false },
    },
    yAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
            color: '#86868B',
            fontSize: 11,
        },
        splitLine: {
            lineStyle: {
                color: 'rgba(0, 0, 0, 0.04)',
                type: 'dashed',
            },
        },
    },
};
export function mergeChartOptions(custom) {
    const merged = JSON.parse(JSON.stringify(chartBaseOptions));
    return Object.assign(merged, custom);
}
