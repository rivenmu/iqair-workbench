<template>
  <div class="empty-state">
    <el-icon size="40" :color="iconColor"><component :is="icon" /></el-icon>
    <span class="empty-text">{{ description }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { FolderOpened } from '@element-plus/icons-vue'

defineProps<{
  description?: string
  icon?: any
  iconColor?: string
}>()
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 12px;
}
.empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}
</style>
