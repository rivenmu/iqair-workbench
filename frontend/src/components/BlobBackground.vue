<template>
  <div class="blob-bg" aria-hidden="true">
    <div class="blob blob-1" />
    <div class="blob blob-2" />
    <div class="blob blob-3" />
  </div>
</template>

<style scoped lang="scss">
.blob-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
}
.blob-1 {
  width: 400px;
  height: 400px;
  background: var(--color-accent);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}
.blob-2 {
  width: 300px;
  height: 300px;
  background: var(--color-info);
  bottom: -50px;
  right: -50px;
  animation-delay: 5s;
}
.blob-3 {
  width: 250px;
  height: 250px;
  background: var(--color-accent);
  top: 50%;
  left: 60%;
  animation-delay: 10s;
}
</style>
