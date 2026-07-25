<template>
  <div class="main-layout">
    <AppNavBar brand-name="IQAir 工作台" :height="56" />
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppNavBar from '@/components/AppNavBar.vue'
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
  overflow-y: auto;
}
</style>
