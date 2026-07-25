<template>
  <router-view v-slot="{ Component }">
    <transition name="page-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
</script>

<style>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 150ms var(--ease-out, cubic-bezier(0, 0, 0.2, 1));
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
