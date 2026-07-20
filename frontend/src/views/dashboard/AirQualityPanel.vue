<template>
  <div class="panel-placeholder">
    <div class="placeholder-card">
      <div class="icon-area">
        <el-icon size="56" color="#007AFF"><WindPower /></el-icon>
      </div>
      <h2 class="placeholder-title">空气质量实时监测面板</h2>
      <p class="placeholder-desc">实时监控空气质量指标，包括 PM2.5、PM10、AQI 等关键数据</p>
      <div class="coming-soon">
        <el-tag type="info" size="large" round>开发中</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WindPower } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.panel-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.placeholder-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.05);
  padding: 48px;
  max-width: 520px;
  width: 100%;
  text-align: center;
}

.icon-area {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(90, 200, 250, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.placeholder-title {
  font-size: 28px;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0 0 8px;
}

.placeholder-desc {
  font-size: 15px;
  color: #86868B;
  margin: 0 0 32px;
  line-height: 1.6;
}

.coming-soon {
  display: flex;
  justify-content: center;
}
</style>
