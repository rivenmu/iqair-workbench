<template>
  <aside class="sidebar" :style="{ width: width + 'px', minWidth: width + 'px' }">
    <nav class="sidebar-nav">
      <slot name="nav-items" />
    </nav>
    <div class="sidebar-bottom">
      <slot name="bottom" />
    </div>
  </aside>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ width?: number }>(), { width: 260 })
</script>

<style scoped lang="scss">
.sidebar {
  background: var(--sidebar-bg);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-md) 10px;
}
.sidebar-bottom {
  padding: var(--spacing-md) 10px;
  border-top: 1px solid var(--color-border-light);
}
</style>
