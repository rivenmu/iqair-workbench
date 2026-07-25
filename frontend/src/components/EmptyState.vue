<template>
  <div class="empty-state">
    <el-icon size="40" color="#AEAEB2"><FolderOpened /></el-icon>
    <span class="empty-text">{{ description }}</span>
  </div>
</template>

<script setup lang="ts">
import { FolderOpened } from '@element-plus/icons-vue'

withDefaults(defineProps<{
  description?: string
}>(), {
  description: '暂无数据'
})
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
  font-size: 14px;
  color: var(--color-text-tertiary);
}
</style>
