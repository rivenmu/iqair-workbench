<template>
  <header class="nav-bar" :style="{ height: height + 'px' }">
    <div class="nav-content">
      <div class="nav-left">
        <slot name="left">
          <div class="brand-area" @click="$router.push('/')">
            <div class="logo">
              <el-icon size="24"><DataLine /></el-icon>
            </div>
            <span class="brand-name">{{ brandName }}</span>
          </div>
        </slot>
      </div>
      <div class="nav-center">
        <slot name="center" />
      </div>
      <div class="nav-right">
        <slot name="right" />
        <UserMenu />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { DataLine } from '@element-plus/icons-vue'
import UserMenu from './UserMenu.vue'
withDefaults(defineProps<{ brandName?: string; height?: number }>(), { brandName: 'IQAir', height: 56 })
</script>

<style scoped lang="scss">
@import '@/styles/tokens.scss';
.nav-bar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-bg-overlay);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border-bottom: 1px solid var(--color-border-light);
}
.nav-content {
  height: 100%;
  padding: 0 var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.nav-left, .nav-right { display: flex; align-items: center; gap: 12px; }
.nav-center { flex: 1; display: flex; align-items: center; min-width: 0; }
.brand-area { display: flex; align-items: center; gap: 10px; cursor: pointer; flex-shrink: 0; transition: opacity var(--transition-fast); &:hover { opacity: 0.7; } }
.logo { width: 36px; height: 36px; border-radius: 10px; background: var(--color-accent-light); display: flex; align-items: center; justify-content: center; }
.brand-name { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); white-space: nowrap; }
</style>
