<template>
  <div class="nav-page">
    <!-- 顶部栏 -->
    <header class="top-bar">
      <div class="top-content">
        <div class="top-left">
          <RivenLogo clickable @click="scrollToSection('work_sites')" />
        </div>
        <div class="top-right">
          <template v-if="!userStore.isLoggedIn">
            <el-button type="primary" round @click="router.push('/login')">
              <el-icon><User /></el-icon>
              <span>登录</span>
            </el-button>
          </template>
          <template v-else>
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="user-avatar">
                <el-avatar :size="32" class="avatar-circle">
                  {{ userStore.username.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="username">{{ userStore.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon> 个人设置
                  </el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" command="users">
                    <el-icon><UserFilled /></el-icon> 用户管理
                  </el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" command="admin">
                    <el-icon><Setting /></el-icon> 管理后台
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </div>
    </header>

    <!-- 主体区域：左侧边栏 + 右侧内容 -->
    <div class="body-area">
      <!-- 左侧边栏 -->
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="sidebar-item"
            :class="{ active: activeSection === cat.key }"
            @click="scrollToSection(cat.key)"
          >
            <el-icon size="18">
              <component :is="cat.icon" />
            </el-icon>
            <span class="sidebar-label">{{ cat.label }}</span>
            <span class="sidebar-count" v-if="sectionData[cat.key]">{{ sectionData[cat.key].length }}</span>
          </button>
        </nav>
      </aside>

      <!-- 右侧滚动内容区 -->
      <main class="scroll-content" ref="scrollContainer" @scroll="handleScroll">
        <div class="content-wrapper">
          <section
            v-for="cat in categories"
            :key="cat.key"
            :id="`section-${cat.key}`"
            class="category-section"
            :ref="el => setSectionRef(cat.key, el)"
          >
            <div class="section-header">
              <div class="section-title-area">
                <el-icon size="22" color="#007AFF">
                  <component :is="cat.icon" />
                </el-icon>
                <h2 class="section-title">{{ cat.label }}</h2>
              </div>
              <el-button
                v-if="userStore.isAdmin && cat.key !== 'favorites'"
                type="primary"
                :icon="Plus"
                round
                size="small"
                @click="openAddDialog(cat.key)"
              >
                添加
              </el-button>
            </div>

            <div class="links-grid" v-loading="sectionLoading[cat.key]">
              <div
                v-for="(link, index) in (sectionData[cat.key] || [])"
                :key="link.id"
                class="link-card"
                :style="{ '--i': index }"
                @click="handleCardClick(link)"
              >
                <div class="card-icon-area">
                  <img v-if="link.icon_image" :src="link.icon_image" :alt="link.name" class="card-icon-img" />
                  <span v-else-if="link.icon_emoji" class="card-icon-emoji">{{ link.icon_emoji }}</span>
                  <div v-else class="card-icon-default">
                    <el-icon size="24" color="#86868B"><Link /></el-icon>
                  </div>
                </div>

                <div class="card-body">
                  <h3 class="card-title">{{ link.name }}</h3>
                  <p class="card-desc">{{ link.description || '暂无描述' }}</p>
                </div>

                <div class="card-footer">
                  <span class="card-url">{{ link.is_internal ? '内部' : link.url }}</span>
                  <el-icon class="card-arrow"><ArrowRight /></el-icon>
                </div>

                <button
                  class="heart-btn"
                  :class="{ favorited: link.is_favorited }"
                  @click.stop="handleFavorite(link, cat.key)"
                >
                  <svg viewBox="0 0 24 24" class="heart-icon" :fill="link.is_favorited ? '#FF3B30' : 'none'" :stroke="link.is_favorited ? '#FF3B30' : '#AEAEB2'" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                <div v-if="userStore.isAdmin && cat.key !== 'favorites'" class="card-admin">
                  <button class="admin-btn fetch-btn" @click.stop="handleFetchIcon(link)" title="抓取图标">
                    <el-icon size="14"><Download /></el-icon>
                  </button>
                  <button class="admin-btn edit-btn" @click.stop="openEditDialog(link)">
                    <el-icon size="14"><Edit /></el-icon>
                  </button>
                  <button class="admin-btn delete-btn" @click.stop="handleDelete(link, cat.key)">
                    <el-icon size="14"><Delete /></el-icon>
                  </button>
                </div>
              </div>

              <div v-if="!sectionLoading[cat.key] && (!sectionData[cat.key] || sectionData[cat.key].length === 0)" class="empty-state">
                <el-icon size="40" color="#D2D2D7"><FolderOpened /></el-icon>
                <p class="empty-text">
                  {{ cat.key === 'favorites' ? '还没有收藏任何链接，点击红心收藏吧' : '暂无链接' }}
                </p>
              </div>
            </div>
          </section>

          <div class="bottom-spacer"></div>
        </div>
      </main>
    </div>

    <!-- 添加/编辑链接对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="editingLink ? '编辑链接' : '添加链接'"
      width="520px"
    >
      <el-form :model="linkForm" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="linkForm.name" placeholder="网站名称" />
        </el-form-item>
        <el-form-item label="链接地址">
          <el-input v-model="linkForm.url" placeholder="https://example.com 或 /dashboard/xxx" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="linkForm.description" type="textarea" :rows="2" placeholder="网站描述（选填）" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="linkForm.category" style="width: 100%">
            <el-option
              v-for="cat in categoryOptions"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内部链接">
          <el-switch v-model="linkForm.is_internal" />
          <span class="form-hint">内部链接使用前端路由跳转</span>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="linkForm.is_active" />
          <span class="form-hint">关闭后前台不显示</span>
        </el-form-item>
        <el-form-item label="图标图片">
          <el-upload
            class="icon-uploader"
            :show-file-list="false"
            :before-upload="handleIconUpload"
            accept="image/*"
          >
            <img v-if="iconPreview" :src="iconPreview" class="icon-preview" />
            <div v-else class="icon-upload-placeholder">
              <el-icon size="20"><Plus /></el-icon>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="图标Emoji">
          <el-input v-model="linkForm.icon_emoji" placeholder="📊（图片图标优先）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="linkForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ editingLink ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus, ArrowDown, ArrowRight, User, UserFilled, SwitchButton,
  Link, Edit, Delete, Download, FolderOpened, Star, Monitor, Tools, MagicStick, Setting
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RivenLogo from '@/components/RivenLogo.vue'
import { navigationApi } from '@/api/navigation'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const categories = [
  { key: 'favorites', label: '我的收藏', icon: Star },
  { key: 'work_sites', label: '工作站点', icon: Monitor },
  { key: 'personal_sites', label: '个人站点', icon: User },
  { key: 'tools', label: '实用工具', icon: Tools },
  { key: 'ai_tools', label: 'AI工具', icon: MagicStick },
]

const categoryOptions = [
  { value: 'work_sites', label: '工作站点' },
  { value: 'personal_sites', label: '个人站点' },
  { value: 'tools', label: '实用工具' },
  { value: 'ai_tools', label: 'AI工具' },
]

const sectionData = reactive<Record<string, any[]>>({})
const sectionLoading = reactive<Record<string, boolean>>({})
const activeSection = ref('work_sites')
const scrollContainer = ref<HTMLElement | null>(null)
const sectionRefs: Record<string, HTMLElement | null> = {}
let scrollTicking = false

const showDialog = ref(false)
const editingLink = ref<any>(null)
const submitting = ref(false)
const iconPreview = ref('')
const iconFile = ref<File | null>(null)

const linkForm = reactive({
  name: '',
  url: '',
  description: '',
  category: 'work_sites',
  is_internal: false,
  is_active: true,
  icon_emoji: '',
  sort_order: 0,
})

function setSectionRef(key: string, el: any) {
  sectionRefs[key] = el as HTMLElement
}

function scrollToSection(key: string) {
  const el = sectionRefs[key]
  if (el && scrollContainer.value) {
    const top = el.offsetTop - 16
    scrollContainer.value.scrollTo({ top, behavior: 'smooth' })
  }
  activeSection.value = key
}

function handleScroll() {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      const container = scrollContainer.value
      if (container) {
        const scrollTop = container.scrollTop + 60
        for (const cat of categories) {
          const el = sectionRefs[cat.key]
          if (el) {
            const top = el.offsetTop
            const bottom = top + el.offsetHeight
            if (scrollTop >= top && scrollTop < bottom) {
              activeSection.value = cat.key
              break
            }
          }
        }
      }
      scrollTicking = false
    })
    scrollTicking = true
  }
}

async function fetchAllSections() {
  const promises = categories.map(cat => fetchSectionData(cat.key))
  await Promise.all(promises)
}

async function fetchSectionData(key: string) {
  sectionLoading[key] = true
  try {
    let data: any[]
    if (key === 'favorites') {
      if (userStore.isLoggedIn) {
        data = await navigationApi.getFavorites()
      } else {
        sectionData[key] = []
        return
      }
    } else {
      data = await navigationApi.getLinks({ category: key })
    }
    sectionData[key] = Array.isArray(data) ? data : []
    if (key === 'work_sites') {
      sectionData[key].unshift({
        id: 'ciyun-link',
        name: '词云图',
        description: '用户评价词云分析',
        url: '/ciyun',
        is_internal: true,
        is_active: true,
        icon_emoji: '☁️',
        is_favorited: false,
      })
    }
  } catch {
    sectionData[key] = []
    if (key === 'work_sites') {
      sectionData[key] = [{
        id: 'ciyun-link',
        name: '词云图',
        description: '用户评价词云分析',
        url: '/ciyun',
        is_internal: true,
        is_active: true,
        icon_emoji: '☁️',
        is_favorited: false,
      }]
    }
  } finally {
    sectionLoading[key] = false
  }
}

function handleCardClick(link: any) {
  if (link.is_internal) {
    if (!userStore.isLoggedIn) {
      ElMessage.info('请先登录')
      router.push({ name: 'Login', query: { redirect: link.url } })
      return
    }
    router.push(link.url)
  } else {
    window.open(link.url, '_blank')
  }
  // 首次点击无图标的链接时自动抓取favicon
  if (!link.is_internal && !link.icon_image && !link.icon_emoji && !link._iconFetching) {
    link._iconFetching = true
    navigationApi.fetchIcon(link.id).then((res: any) => {
      if (res.success && res.link?.icon_image) {
        link.icon_image = res.link.icon_image
      }
    }).catch(() => {
      // 抓取失败静默处理
    }).finally(() => {
      link._iconFetching = false
    })
  }
}

async function handleFavorite(link: any, sectionKey: string) {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: '/' } })
    return
  }
  try {
    const res = await navigationApi.toggleFavorite(link.id)
    link.is_favorited = res.is_favorited
    if (sectionKey === 'favorites' && !res.is_favorited) {
      sectionData.favorites = sectionData.favorites.filter(l => l.id !== link.id)
    }
  } catch {
    // 错误已在拦截器处理
  }
}

function openAddDialog(category?: string) {
  editingLink.value = null
  linkForm.name = ''
  linkForm.url = ''
  linkForm.description = ''
  linkForm.category = category && category !== 'favorites' ? category : 'work_sites'
  linkForm.is_internal = false
  linkForm.is_active = true
  linkForm.icon_emoji = ''
  linkForm.sort_order = 0
  iconPreview.value = ''
  iconFile.value = null
  showDialog.value = true
}

function openEditDialog(link: any) {
  editingLink.value = link
  linkForm.name = link.name
  linkForm.url = link.url
  linkForm.description = link.description || ''
  linkForm.category = link.category
  linkForm.is_internal = link.is_internal
  linkForm.icon_emoji = link.icon_emoji || ''
  linkForm.sort_order = link.sort_order || 0
  linkForm.is_active = link.is_active !== false
  iconPreview.value = link.icon_image || ''
  iconFile.value = null
  showDialog.value = true
}

function handleIconUpload(file: File) {
  iconFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    iconPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  return false
}

async function handleSubmit() {
  if (!linkForm.name || !linkForm.url) {
    ElMessage.warning('请填写名称和链接地址')
    return
  }
  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('name', linkForm.name)
    formData.append('url', linkForm.url)
    formData.append('description', linkForm.description)
    formData.append('category', linkForm.category)
    formData.append('is_internal', String(linkForm.is_internal))
    formData.append('is_active', String(linkForm.is_active))
    formData.append('icon_emoji', linkForm.icon_emoji)
    formData.append('sort_order', String(linkForm.sort_order))
    if (iconFile.value) {
      formData.append('icon_image', iconFile.value)
    }

    if (editingLink.value) {
      await navigationApi.updateLink(editingLink.value.id, formData)
      ElMessage.success('链接更新成功')
    } else {
      await navigationApi.createLink(formData)
      ElMessage.success('链接添加成功')
    }
    showDialog.value = false
    fetchSectionData(linkForm.category)
    if (userStore.isLoggedIn) {
      fetchSectionData('favorites')
    }
  } catch {
    // 错误已在拦截器处理
  } finally {
    submitting.value = false
  }
}

async function handleDelete(link: any, sectionKey: string) {
  try {
    await ElMessageBox.confirm(`确定要删除"${link.name}"吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await navigationApi.deleteLink(link.id)
    ElMessage.success('删除成功')
    sectionData[sectionKey] = sectionData[sectionKey].filter(l => l.id !== link.id)
  } catch {
    // 用户取消
  }
}

async function handleFetchIcon(link: any) {
  try {
    ElMessage.info(`正在抓取 ${link.name} 的图标...`)
    const res = await navigationApi.fetchIcon(link.id)
    if (res.success && res.link?.icon_image) {
      link.icon_image = res.link.icon_image
      ElMessage.success('图标抓取成功')
    } else {
      ElMessage.warning(res.message || '未找到图标')
    }
  } catch {
    ElMessage.error('图标抓取失败')
  }
}

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'users':
      router.push('/users')
      break
    case 'admin':
      window.open(`/api/auth/admin-sso/?token=${userStore.token}`, '_blank')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '退出',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        userStore.logout()
        router.push('/')
      }).catch(() => {})
      break
  }
}

onMounted(async () => {
  await fetchAllSections()
  await nextTick()
})
</script>

<style scoped lang="scss">
.nav-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 顶部栏
.top-bar {
  position: relative;
  z-index: 100;
  height: 60px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.top-content {
  height: 100%;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-right {
  display: flex;
  align-items: center;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}

.avatar-circle {
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  color: white;
  font-weight: 600;
}

.username {
  font-size: 14px;
  color: #1C1C1E;
  font-weight: 500;
}

// 主体区域
.body-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// 左侧边栏
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: rgba(245, 247, 250, 0.6);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 12px;
  overflow-y: auto;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  position: relative;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: var(--color-text-primary);
  }

  &.active {
    background: rgba(0, 122, 255, 0.1);
    color: #007AFF;
    font-weight: 600;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      border-radius: 0 2px 2px 0;
      background: #007AFF;
    }
  }
}

.sidebar-label {
  flex: 1;
}

.sidebar-count {
  font-size: 12px;
  font-weight: 600;
  color: #86868B;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.sidebar-item.active .sidebar-count {
  color: #007AFF;
  background: rgba(0, 122, 255, 0.12);
}

// 右侧滚动内容区
.scroll-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.content-wrapper {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 40px;
}

// 分类区块
.category-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(0, 122, 255, 0.08);
}

.section-title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}

// 链接卡片网格
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

// 链接卡片
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
  animation: slideInUp 0.4s ease backwards;
  animation-delay: calc(var(--i) * 0.04s);

  &:hover {
    transform: scale(1.03) translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 122, 255, 0.2);
  }

  &:active {
    transform: scale(1.01);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-icon-area {
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

.card-icon-emoji {
  font-size: 26px;
  line-height: 1;
}

.card-icon-default {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-body {
  flex: 1;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.card-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
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
  max-width: 140px;
}

.card-arrow {
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);
}

.link-card:hover .card-arrow {
  transform: translateX(4px);
  color: var(--color-accent);
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

  &.favorited .heart-icon {
    animation: heartPulse 0.4s ease;
  }
}

.heart-icon {
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

.link-card:hover .card-admin {
  opacity: 1;
}

.admin-btn {
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

  &.delete-btn:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
  }

  &.fetch-btn:hover {
    color: #34C759;
    border-color: #34C759;
  }
}

// 空状态
.empty-state {
  grid-column: 1 / -1;
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

.bottom-spacer {
  height: 32px;
}

// 图标上传
.icon-uploader {
  :deep(.el-upload) {
    width: 64px;
    height: 64px;
    border: 1px dashed var(--color-border);
    border-radius: 10px;
    cursor: pointer;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color var(--transition-fast);

    &:hover {
      border-color: var(--color-accent);
    }
  }
}

.icon-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-upload-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.form-hint {
  margin-left: 12px;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

// 响应式
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
    padding: 16px 6px;
  }

  .sidebar-label,
  .sidebar-count {
    display: none;
  }

  .sidebar-item {
    justify-content: center;
    padding: 10px;
  }

  .content-wrapper {
    padding: 16px;
  }

  .links-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}
</style>
