<template>
  <div class="letter-avatar" :style="{ width: size + 'px', height: size + 'px', backgroundColor: bg, fontSize: (size * 0.45) + 'px' }">
    {{ letter }}
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 44 })
const colors = ['#4F46E5','#0891B2','#EA580C','#059669','#DC2626','#2563EB','#7C3AED','#D97706']
const bg = computed(() => colors[props.name.charCodeAt(0) % colors.length])
const letter = computed(() => props.name.charAt(0).toUpperCase())
</script>
<style scoped>
.letter-avatar { display: flex; align-items: center; justify-content: center; border-radius: 10px; color: #fff; font-weight: 700; flex-shrink: 0; }
</style>
