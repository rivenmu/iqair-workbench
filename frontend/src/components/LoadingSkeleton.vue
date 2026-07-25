<template>
  <div class="skeleton-wrapper" :class="variant">
    <div v-if="variant === 'card'" class="skeleton-card">
      <div class="skeleton-line w-60" />
      <div class="skeleton-line w-80" />
      <div class="skeleton-line w-40" />
    </div>
    <div v-else-if="variant === 'table'" class="skeleton-table">
      <div v-for="i in rows" :key="i" class="skeleton-row">
        <div class="skeleton-cell" v-for="j in cols" :key="j" />
      </div>
    </div>
    <div v-else-if="variant === 'chart'" class="skeleton-chart">
      <div class="skeleton-bar" v-for="i in 7" :key="i" :style="{ height: (30 + Math.random() * 50) + '%' }" />
    </div>
    <div v-else class="skeleton-lines">
      <div v-for="i in count" :key="i" class="skeleton-line" :style="{ width: (60 + Math.random() * 40) + '%' }" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'lines' | 'card' | 'table' | 'chart'
  count?: number
  rows?: number
  cols?: number
}>(), { variant: 'lines', count: 3, rows: 4, cols: 4 })
</script>

<style scoped lang="scss">
.skeleton-wrapper { width: 100%; }
.skeleton-line,
.skeleton-cell,
.skeleton-bar {
  background: linear-gradient(90deg, var(--color-border-light) 25%, rgba(0,0,0,0.04) 37%, var(--color-border-light) 63%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-xs);
}
.skeleton-lines { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.skeleton-line { height: 14px; &.w-60 { width: 60%; } &.w-80 { width: 80%; } &.w-40 { width: 40%; } }
.skeleton-card { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
.skeleton-table { display: flex; flex-direction: column; gap: 8px; }
.skeleton-row { display: flex; gap: 8px; }
.skeleton-cell { flex: 1; height: 32px; }
.skeleton-chart { display: flex; align-items: flex-end; gap: 8px; height: 200px; padding: 16px; }
.skeleton-bar { flex: 1; }
@keyframes skeletonShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
