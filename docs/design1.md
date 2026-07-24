# RIVEN 首页设计规范 — 主题色块方案

> 版本：v1.0  
> 日期：2026-07-23  
> 设计方向：主题色块（Color Blocks）

---

## 1. 设计理念

**签名元素**：彩色色块是页面的视觉锚点，每个内部项目拥有独特的渐变身份色，像彩色便签纸一样在白色空间中"跳"出来。背景的微妙纹理（subtle dot pattern）给页面增加触感，避免纯数字界面的冰冷感。

**设计原则**：
- 色块是主角，其余一切保持克制
- 尺寸对比制造层级，而非装饰堆叠
- 纹理是氛围，不是焦点

---

## 2. 色彩系统

### 2.1 内部项目渐变色

| 项目 | 起始色 | 结束色 | 渐变方向 | 色感 |
|------|--------|--------|----------|------|
| IQAir数据工作台 | #4F46E5 靛蓝 | #7C3AED 紫 | 135deg | 专业、数据感 |
| 词云图生成器 | #0891B2 青 | #06B6D4 天蓝 | 135deg | 清新、洞察 |
| BI看板 | #EA580C 深橙 | #F97316 橙 | 135deg | 活力、增长 |

**扩展预留**（未来第4-5个项目）：
| 备选 | 起始色 | 结束色 |
|------|--------|--------|
| 备选1 | #059669 翠绿 | #10B981 绿 |
| 备选2 | #DB2777 玫红 | #EC4899 粉 |

### 2.2 基础色板

`scss
// 页面背景
--bg-page: #FAFAFA;                    // 主背景（极浅灰）
--bg-texture: rgba(0, 0, 0, 0.015);    // 纹理点颜色

// 边栏
--sidebar-bg: #F5F5F7;                 // 边栏背景
--sidebar-active-bg: #FFFFFF;          // 选中项背景
--sidebar-active-indicator: #007AFF;   // 选中指示色

// 普通网址卡片
--card-bg: #FFFFFF;
--card-border: rgba(0, 0, 0, 0.06);
--card-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

// 文字
--text-primary: #1C1C1E;
--text-secondary: #86868B;
--text-tertiary: #AEAEB2;
--text-on-color: #FFFFFF;              // 色块上的文字（白色）
`

### 2.3 色块上的图标

所有内部项目图标统一使用 **白色**，透明度 90%，确保在彩色背景上清晰可辨。

---

## 3. 布局系统

### 3.1 页面结构

`
┌─────────────────────────────────────────────────────────────────┐
│ 顶部栏 (56px)                                                    │
│ [Logo]                                            [用户头像/登录] │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│  左侧边栏 │  内容区                                               │
│  (140px) │                                                      │
│          │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│ ┌──────┐ │  │             │ │             │ │             │    │
│ │个人站│ │  │  IQAir数据工作台  │ │  词云图生成器   │ │  BI看板   │    │
│ │点    │ │  │             │ │             │ │             │    │
│ ├──────┤ │  │  渐变色块    │ │  渐变色块   │ │  渐变色块   │    │
│ │实用工│ │  │  (200px高)  │ │  (200px高)  │ │  (200px高)  │    │
│ │具    │ │  └─────────────┘ └─────────────┘ └─────────────┘    │
│ ├──────┤ │                                                      │
│ │AI工具│ │  ─────────── 分类标题 ───────────                    │
│ │      │ │                                                      │
│ └──────┘ │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│          │  │卡片│ │卡片│ │卡片│ │卡片│ │卡片│ │卡片│        │
│          │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘        │
└──────────┴──────────────────────────────────────────────────────┘
`

### 3.2 尺寸规范

| 元素 | 尺寸 | 说明 |
|------|------|------|
| 顶部栏高度 | 56px | 保持现有 |
| 左侧边栏宽度 | 140px | 从60px加宽 |
| 内部项目卡片高度 | 200px | 大卡片 |
| 内部项目卡片宽度 | 280px | 固定宽度 |
| 内部项目卡片间距 | 20px | 卡片间距离 |
| 普通网址卡片宽度 | 180px | 保持现有 |
| 普通网址卡片高度 | 150px | 保持现有 |
| 普通网址卡片间距 | 16px | 保持现有 |
| 内容区内边距 | 32px | 上下左右 |

### 3.3 内部项目卡片布局

`
┌─────────────────────────────┐
│                             │  24px 内边距
│   ◈ (40x40 图标)            │
│                             │
│                             │  16px 间距
│   项目名称 (20px, 600)      │
│                             │
│   描述文字 (14px, 400)      │  8px 间距
│                             │
│                             │
└─────────────────────────────┘
  280px × 200px, border-radius: 16px
`

- 图标：左上角，40×40px，白色，opacity 0.9
- 项目名称：白色，20px，font-weight 600
- 描述文字：白色，14px，opacity 0.85

---

## 4. 左侧边栏设计

### 4.1 边栏结构

`
┌────────────────────┐
│                    │  16px 上边距
│  ┌──────────────┐  │
│  │ ◇ 个人站点   │  │  ← 普通状态
│  └──────────────┘  │
│                    │  4px 间距
│  ┌──────────────┐  │
│  │ ◆ 实用工具   │  │  ← 选中状态（白色背景 + 左侧竖线）
│  └──────────────┘  │
│                    │
│  ┌──────────────┐  │
│  │ ◇ AI工具     │  │
│  └──────────────┘  │
│                    │
└────────────────────┘
  140px 宽, 背景 #F5F5F7
`

### 4.2 标签样式

| 状态 | 背景 | 文字色 | 左侧指示 |
|------|------|--------|----------|
| 普通 | 透明 | #86868B | 无 |
| 悬停 | gba(0,0,0,0.03) | #1C1C1E | 无 |
| 选中 | #FFFFFF | #1C1C1E | 3px #007AFF 竖线 |

- 标签高度：44px
- 左侧内边距：16px
- 圆角：10px
- 图标大小：18px
- 图标与文字间距：10px

---

## 5. 背景纹理

使用CSS实现的微妙点阵纹理，增加页面质感但不喧宾夺主。

`scss
.page-background {
  background-color: var(--bg-page);
  background-image: radial-gradient(
    circle,
    var(--bg-texture) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}
`

**效果**：24px间距的细小圆点，颜色极浅（opacity 1.5%），肉眼可见但不干扰阅读。

---

## 6. 普通网址卡片

保持现有样式，微调细节：

`scss
.link-card {
  width: 180px;
  min-height: 150px;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  &:hover {
    transform: scale(1.03) translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}
`

**移除**：红心收藏按钮、收藏相关逻辑

---

## 7. 动画规范

### 7.1 内部项目卡片进入动画

`scss
@keyframes featuredSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.featured-card {
  animation: featuredSlideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
}
`

### 7.2 内部项目卡片悬停效果

`scss
.featured-card {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(-2px) scale(1.01);
  }
}
`

### 7.3 普通网址卡片悬停

保持现有动画，移除收藏相关的动画。

---

## 8. 分类标题样式

普通网址区域的分类标题：

`
──────────  个人站点  ──────────
`

`scss
.section-title {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 32px 0 20px;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 0, 0, 0.08),
      transparent
    );
  }
  
  .title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
  }
}
`

---

## 9. 响应式规范

### 9.1 桌面端（≥1200px）

- 完整布局，内部项目卡片横向排列3个
- 左侧边栏 140px

### 9.2 平板端（768px - 1199px）

- 内部项目卡片改为2个，可换行
- 左侧边栏保持 140px

### 9.3 移动端（<768px）

- 内部项目卡片全宽，纵向堆叠
- 左侧边栏收起，改为顶部标签栏或汉堡菜单
- 普通网址卡片宽度 100%

---

## 10. 组件清单

| 组件 | 文件 | 说明 |
|------|------|------|
| FeaturedCard | 新增 | 内部项目大卡片 |
| CategorySidebar | 修改 | 加宽、背景色、选中状态 |
| LinkCard | 修改 | 移除收藏按钮 |
| SectionTitle | 修改 | 新的分割线样式 |
| PageBackground | 修改 | 添加纹理 |

---

## 11. 技术实现要点

### 11.1 纹理背景实现

纯CSS实现，无图片依赖：

`scss
.nav-page {
  min-height: 100vh;
  background-color: #FAFAFA;
  background-image: radial-gradient(circle, rgba(0,0,0,0.015) 1px, transparent 1px);
  background-size: 24px 24px;
}
`

### 11.2 渐变色定义

`scss
// 在 tokens.scss 中新增
--gradient-iqair: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
--gradient-competitor: linear-gradient(135deg, #0891B2 0%, #06B6D4 100%);
--gradient-sales: linear-gradient(135deg, #EA580C 0%, #F97316 100%);
`

### 11.3 移除收藏功能

需要删除的代码：
- 前端：Navigation.vue 中的红心按钮、收藏API调用
- 前端：pi/navigation.ts 中的 getFavorites、	oggleFavorite
- 后端：可选保留模型，删除API端点或标记废弃

---

## 12. 设计自查清单

- [ ] 内部项目色块是否有足够的视觉冲击力？
- [ ] 色块上的白色文字是否清晰可读？
- [ ] 纹理背景是否过于明显？
- [ ] 边栏加宽后是否挤压内容区？
- [ ] 移除收藏功能后界面是否更简洁？
- [ ] 移动端布局是否合理？

---

> **设计者**：MiMo + Riven  
> **最后更新**：2026-07-23

