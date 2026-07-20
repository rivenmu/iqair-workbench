<template>
  <div class="riven-logo" :class="{ clickable }">
    <svg class="logo-svg" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rivenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#007AFF" />
          <stop offset="100%" stop-color="#5AC8FA" />
        </linearGradient>
      </defs>
      <path
        d="M8 4 L8 32 M8 4 L20 4 C26 4 30 8 30 14 C30 20 26 24 20 24 L8 24 M20 24 L30 32"
        stroke="url(#rivenGrad)"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <text
        x="40" y="25"
        font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        font-size="20"
        font-weight="700"
        fill="#1C1C1E"
        letter-spacing="2"
      >RIVEN</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  clickable?: boolean
}>()
</script>

<style scoped lang="scss">
.riven-logo {
  display: flex;
  align-items: center;

  .logo-svg {
    height: 28px;
    width: auto;
  }

  &.clickable {
    cursor: pointer;
    transition: opacity var(--transition-fast);

    &:hover {
      opacity: 0.75;
    }
  }
}
</style>
