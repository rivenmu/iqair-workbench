<template>
  <div class="stat-card" :class="{ active: active }" @click="$emit('click')">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value" :style="{ color: accentColor }">{{ formattedValue }}</div>
    <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
    <div v-if="trend !== undefined" class="stat-trend" :class="trendClass">
      <el-icon size="14"><component :is="trendIcon" /></el-icon>
      <span>{{ trendText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

const props = defineProps<{
  label: string
  value: number | string
  subtitle?: string
  accentColor?: string
  format?: 'number' | 'currency' | 'percent'
  trend?: number
  active?: boolean
}>()
defineEmits(['click'])

const formattedValue = computed(() => {
  const v = props.value
  if (typeof v === 'string') return v
  if (props.format === 'currency') return '¥' + v.toLocaleString()
  if (props.format === 'percent') return v.toFixed(2) + '%'
  return v.toLocaleString()
})
const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend > 0 ? 'up' : props.trend < 0 ? 'down' : 'flat'
})
const trendIcon = computed(() => {
  if (props.trend === undefined) return Minus
  return props.trend > 0 ? ArrowUp : props.trend < 0 ? ArrowDown : Minus
})
const trendText = computed(() => {
  if (props.trend === undefined) return ''
  return Math.abs(props.trend).toFixed(1) + '%'
})
</script>

<style scoped lang="scss">
.stat-card {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  cursor: default;
  transition: all var(--transition-fast);
  &.active {
    border-color: var(--color-accent);
    background: var(--color-accent-light);
  }
}
.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 4px 0;
}
.stat-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  margin-top: 4px;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  &.up { color: var(--color-success); background: rgba(52,199,89,0.1); }
  &.down { color: var(--color-danger); background: rgba(255,59,48,0.1); }
  &.flat { color: var(--color-text-secondary); background: rgba(0,0,0,0.05); }
}
</style>
