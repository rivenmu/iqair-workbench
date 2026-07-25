<template>
  <div
    class="letter-avatar"
    :style="{
      width: size + 'px',
      height: size + 'px',
      fontSize: size * 0.42 + 'px',
      backgroundColor: bgColor
    }"
  >
    {{ initial }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  size?: number
}>(), {
  size: 40
})

const initial = computed(() => {
  const trimmed = props.name.trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0).toUpperCase()
})

const bgColor = computed(() => {
  const colors = [
    '#4F46E5', '#7C3AED', '#0891B2', '#EA580C',
    '#DC2626', '#059669', '#D946EF', '#2563EB',
    '#C026D3', '#0D9488', '#F59E0B', '#6366F1'
  ]
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})
</script>

<style scoped lang="scss">
.letter-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #FFFFFF;
  font-weight: 700;
  user-select: none;
  flex-shrink: 0;
}
</style>
