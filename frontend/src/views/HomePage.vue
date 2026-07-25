<template>
  <div class="home-page">
    <!-- 顶部导航栏 -->
    <header class="top-bar">
      <div class="top-content">
        <div class="top-left">
          <RivenLogo clickable @click="scrollToTop" />
        </div>
        <div class="top-right">
          <template v-if="!userStore.isLoggedIn">
            <el-button type="primary" round @click="router.push('/login')">
              <el-icon><User /></el-icon>
              <span>登录</span>
            </el-button>
          </template>
          <template v-else>
            <UserMenu />
          </template>
        </div>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Hero 色块区域 -->
        <section v-if="heroProjects.length" class="hero-section">
          <div class="hero-grid">
            <div
              v-for="(project, index) in heroProjects"
              :key="project.id"
              class="hero-card"
              :style="{
                background: project.gradient_color || defaultGradient,
                '--i': index
              }"
              @click="handleHeroClick(project)"
            >
              <div class="hero-icon">
                <img v-if="project.icon_type === 'image' && project.thumbnail" :src="project.thumbnail" :alt="project.name" />
                <span v-else-if="project.icon_type === 'emoji' && project.icon_emoji" class="hero-emoji">{{ project.icon_emoji }}</span>
                <el-icon v-else size="32" color="rgba(255,255,255,0.9)"><Monitor /></el-icon>
              </div>
              <div class="hero-body">
                <h3 class="hero-title">{{ project.name }}</h3>
                <p class="hero-desc">{{ project.subtitle || project.description || '进入项目' }}</p>
              </div>
              <el-icon class="hero-arrow" size="20"><ArrowRight /></el-icon>

              <!-- 管理员编辑按钮 -->
              <button
                v-if="userStore.isAdmin"
                class="hero-edit-btn"
                title="编辑色块"
                @click.stop="openHeroEdit(project)"
              >
                <el-icon size="14"><Edit /></el-icon>
              </button>
            </div>
          </div>
        </section>

        <!-- Tab 分类区域 -->
        <div class="tab-bar">
          <div class="tabs">
            <button
              v-for="cat in displayCategories"
              :key="cat.key"
              class="tab-btn"
              :class="{ active: activeTab === cat.key }"
              @click="activeTab = cat.key"
            >
              {{ cat.label }}
            </button>
          </div>
          <div v-if="userStore.isAdmin" class="tab-actions">
            <el-button :icon="Plus" size="small" round @click="openAddLink">
              添加
            </el-button>
          </div>
        </div>

        <!-- 链接卡片网格 -->
        <div class="links-grid" v-loading="loading">
          <div
            v-for="(link, index) in currentLinks"
            :key="link.id"
            class="link-card"
            :style="{ '--i': index }"
            @click="handleLinkClick(link)"
          >
            <!-- 图标区域 -->
            <div class="card-icon">
              <img v-if="link.icon_image" :src="link.icon_image" :alt="link.name" class="card-icon-img" />
              <LetterAvatar v-else :name="link.name" :size="40" />
            </div>

            <!-- 文字区域 -->
            <div class="card-body">
              <h4 class="card-title">{{ link.name }}</h4>
              <p class="card-desc">{{ link.description || '暂无描述' }}</p>
            </div>

            <!-- 底部 -->
            <div class="card-footer">
              <span class="card-url">{{ link.is_internal ? '内部' : link.url }}</span>
              <el-icon size="14" class="card-arrow"><ArrowRight /></el-icon>
            </div>

            <!-- 红心收藏按钮 -->
            <button
              class="heart-btn"
              :class="{ fav: link.is_favorited }"
              @click.stop="handleFavorite(link)"
            >
              <svg viewBox="0 0 24 24" class="heart-svg" :fill="link.is_favorited ? '#FF3B30' : 'none'" :stroke="link.is_favorited ? '#FF3B30' : '#AEAEB2'" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            <!-- 管理员操作按钮 -->
            <div v-if="userStore.isAdmin" class="card-admin">
              <button class="adm-btn" title="编辑" @click.stop="openEditLink(link)">
                <el-icon size="14"><Edit /></el-icon>
              </button>
              <button class="adm-btn del" title="删除" @click.stop="handleDelete(link)">
                <el-icon size="14"><Delete /></el-icon>
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <EmptyState v-if="!loading && !currentLinks.length" description="暂无链接" />
        </div>
      </div>
    </main>

    <!-- 添加/编辑链接弹窗 -->
    <el-dialog
      v-model="dlg.visible"
      :title="dlg.title"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="dlg.form" label-width="80px" label-position="left">
        <el-form-item label="名称" required>
          <el-input v-model="dlg.form.name" placeholder="网站名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="链接" required>
          <el-input v-model="dlg.form.url" placeholder="https://example.com 或 /internal-path" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="dlg.form.description" type="textarea" :rows="2" placeholder="简短描述（可选）" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="dlg.form.category" style="width: 100%">
            <el-option v-for="opt in categoryOpts" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dlg.form.sort_order" :min="0" :max="9999" />
          <span class="form-hint">数字越小越靠前</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitLink">
          {{ dlg.editing ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑色块弹窗 -->
    <el-dialog
      v-model="heroDlg.visible"
      title="编辑色块"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="heroDlg.form" label-width="80px" label-position="left">
        <el-form-item label="名称" required>
          <el-input v-model="heroDlg.form.name" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="heroDlg.form.subtitle" placeholder="简短描述" />
        </el-form-item>
        <el-form-item label="路由" required>
          <el-input v-model="heroDlg.form.route" placeholder="/dashboard/iqair-competitor 或 https://..." />
        </el-form-item>
        <el-form-item label="渐变色">
          <el-input v-model="heroDlg.form.gradient_color" placeholder="linear-gradient(135deg, #4F46E5, #7C3AED)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="heroDlg.visible = false">取消</el-button>
        <el-button type="primary" :loading="heroSaving" @click="submitHero">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, ArrowRight, User, Edit, Delete, Monitor } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RivenLogo from '@/components/RivenLogo.vue'
import UserMenu from '@/components/UserMenu.vue'
import LetterAvatar from '@/components/LetterAvatar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { navigationApi } from '@/api/navigation'
import { projectsApi } from '@/api/projects'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const activeTab = ref('common_sites')
const allLinks = reactive<Record<string, any[]>>({})
const heroProjects = ref<any[]>([])
const saving = ref(false)
const heroSaving = ref(false)

const defaultGradient = 'linear-gradient(135deg, #4F46E5, #7C3AED)'

const displayCategories = [
  { key: 'common_sites', label: '常用网址' },
  { key: 'friend_links', label: '友情链接' },
  { key: 'ai_resources', label: 'AI工具资料' },
]

const categoryOpts = [
  { value: 'common_sites', label: '常用网址' },
  { value: 'friend_links', label: '友情链接' },
  { value: 'ai_resources', label: 'AI工具资料' },
]

const currentLinks = computed(() => allLinks[activeTab.value] || [])

// 弹窗状态
const dlg = reactive({
  visible: false,
  title: '',
  editing: false,
  form: {
    id: 0,
    name: '',
    url: '',
    description: '',
    category: 'common_sites',
    sort_order: 0,
    is_internal: false,
  }
})

const heroDlg = reactive({
  visible: false,
  form: {
    id: 0,
    name: '',
    subtitle: '',
    route: '',
    gradient_color: '',
  }
})

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true
  try {
    const [projectsData, ...linkResults] = await Promise.all([
      projectsApi.getProjects().catch(() => []),
      ...displayCategories.map(c => navigationApi.getLinks({ category: c.key }).catch(() => []))
    ])
    const projects = Array.isArray(projectsData) ? projectsData : (projectsData as any)?.results || []
    heroProjects.value = projects.filter((p: any) => p.is_featured).map((p: any) => ({
      ...p,
      gradient_color: p.gradient_color || defaultGradient
    }))
    displayCategories.forEach((c, i) => {
      const data = linkResults[i]
      allLinks[c.key] = Array.isArray(data) ? data : (data as any)?.results || []
    })
  } catch {
    // 静默处理
  } finally {
    loading.value = false
  }
}

// ==================== 点击操作 ====================

function handleHeroClick(project: any) {
  if (project.route.startsWith('http')) {
    window.open(project.route, '_blank')
  } else {
    router.push(project.route)
  }
}

function handleLinkClick(link: any) {
  if (link.is_internal) {
    router.push(link.url)
  } else {
    window.open(link.url, '_blank')
  }
}

async function handleFavorite(link: any) {
  if (!userStore.isLoggedIn) return
  try {
    const res = await navigationApi.toggleFavorite(link.id)
    link.is_favorited = res.is_favorited
  } catch {
    // 静默处理
  }
}

// ==================== 管理操作：链接 ====================

function openAddLink() {
  dlg.editing = false
  dlg.title = '添加链接'
  dlg.form = { id: 0, name: '', url: '', description: '', category: activeTab.value, sort_order: 0, is_internal: false }
  dlg.visible = true
}

function openEditLink(link: any) {
  dlg.editing = true
  dlg.title = '编辑链接'
  dlg.form = {
    id: link.id,
    name: link.name,
    url: link.url,
    description: link.description || '',
    category: link.category,
    sort_order: link.sort_order || 0,
    is_internal: link.is_internal,
  }
  dlg.visible = true
}

async function submitLink() {
  if (!dlg.form.name || !dlg.form.url) {
    ElMessage.warning('请填写名称和链接')
    return
  }
  saving.value = true
  try {
    if (dlg.editing) {
      await navigationApi.updateLink(dlg.form.id, dlg.form as any)
      ElMessage.success('已更新')
    } else {
      await navigationApi.createLink(dlg.form as any)
      ElMessage.success('已添加')
    }
    dlg.visible = false
    const data = await navigationApi.getLinks({ category: dlg.form.category })
    allLinks[dlg.form.category] = Array.isArray(data) ? data : (data as any)?.results || []
    activeTab.value = dlg.form.category
  } catch {
    // 错误已在拦截器处理
  } finally {
    saving.value = false
  }
}

async function handleDelete(link: any) {
  try {
    await ElMessageBox.confirm(`确定删除"${link.name}"？`, '提示', { type: 'warning' })
    await navigationApi.deleteLink(link.id)
    allLinks[activeTab.value] = allLinks[activeTab.value].filter(l => l.id !== link.id)
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}

// ==================== 管理操作：色块 ====================

function openHeroEdit(project: any) {
  heroDlg.form = {
    id: project.id,
    name: project.name,
    subtitle: project.subtitle || '',
    route: project.route,
    gradient_color: project.gradient_color || '',
  }
  heroDlg.visible = true
}

async function submitHero() {
  if (!heroDlg.form.name) {
    ElMessage.warning('请填写名称')
    return
  }
  heroSaving.value = true
  try {
    await projectsApi.updateProject(heroDlg.form.id, heroDlg.form)
    const idx = heroProjects.value.findIndex(p => p.id === heroDlg.form.id)
    if (idx >= 0) {
      Object.assign(heroProjects.value[idx], heroDlg.form)
      heroProjects.value[idx].gradient_color = heroDlg.form.gradient_color || defaultGradient
    }
    heroDlg.visible = false
    ElMessage.success('已保存')
  } catch {
    // 错误已在拦截器处理
  } finally {
    heroSaving.value = false
  }
}

// ==================== 初始化 ====================

onMounted(loadData)
</script>

<style lang="scss" scoped>
@import '@/styles/tokens.scss';

// ============================================
// 页面整体
// ============================================
.home-page {
  min-height: 100vh;
  background-color: var(--bg-page);
  background-image: radial-gradient(circle, var(--bg-texture) 1px, transparent 1px);
  background-size: 24px 24px;
}

// ============================================
// 顶部导航栏
// ============================================
.top-bar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  height: 56px;
  background: var(--color-bg-overlay);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border-bottom: 1px solid var(--color-border-light);
}

.top-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-left {
  display: flex;
  align-items: center;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

// ============================================
// 主体内容
// ============================================
.main-content {
  max-width: 1400px;
  margin: 0 auto;
}

.content-wrapper {
  padding: 32px 24px;
}

// ============================================
// Hero 色块区
// ============================================
.hero-section {
  margin-bottom: 40px;
}

.hero-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.hero-card {
  width: 340px;
  min-height: 180px;
  border-radius: 18px;
  padding: 24px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  overflow: hidden;
  color: #fff;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation: heroSlideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards;
  animation-delay: calc(var(--i) * 0.1s + 0.1s);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);

    .hero-arrow {
      opacity: 1;
      transform: translateX(4px);
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.01);
  }
}

@keyframes heroSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.hero-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hero-emoji {
  font-size: 28px;
  line-height: 1;
}

.hero-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
}

.hero-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
  margin: 0;
}

.hero-arrow {
  position: absolute;
  bottom: 20px;
  right: 20px;
  color: rgba(255, 255, 255, 0.6);
  opacity: 0.7;
  transition: all var(--transition-fast);
}

.hero-edit-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
  backdrop-filter: blur(4px);

  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }
}

// ============================================
// Tab 栏
// ============================================
.tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: var(--color-text-primary);
  }

  &.active {
    background: var(--color-text-primary);
    color: var(--color-text-inverse);
  }
}

.tab-actions {
  display: flex;
  gap: 8px;
}

// ============================================
// 链接卡片网格
// ============================================
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  min-height: 120px;
}

.link-card {
  position: relative;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 150px;
  animation: cardSlideIn 0.4s ease backwards;
  animation-delay: calc(var(--i) * 0.04s);

  &:hover {
    transform: scale(1.03) translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 122, 255, 0.2);

    .card-arrow {
      transform: translateX(4px);
      color: var(--color-accent);
    }

    .card-admin {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(1.01);
  }
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.card-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body {
  flex: 1;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-url {
  font-size: 11px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.card-arrow {
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

// 红心收藏按钮
.heart-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  background: none;

  &:hover {
    background: rgba(255, 59, 48, 0.1);
  }

  &.fav .heart-svg {
    animation: heartPulse 0.4s ease;
  }
}

.heart-svg {
  width: 18px;
  height: 18px;
  transition: all var(--transition-fast);
}

@keyframes heartPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

// 管理员操作按钮
.card-admin {
  position: absolute;
  bottom: 14px;
  right: 14px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.adm-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid var(--color-border-light);
  background: #FFFFFF;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  &.del:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
  }
}

// ============================================
// 表单提示
// ============================================
.form-hint {
  margin-left: 12px;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

// ============================================
// 响应式
// ============================================
@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }

  .hero-grid {
    flex-direction: column;
  }

  .hero-card {
    width: 100%;
  }

  .links-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .hero-grid {
    gap: 16px;
  }

  .hero-card {
    width: calc(50% - 8px);
    min-width: 240px;
  }
}
</style>
