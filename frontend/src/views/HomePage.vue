<template>
  <div class="home-page">
    <header class="top-bar">
      <div class="top-content">
        <div class="top-left">
          <RivenLogo clickable @click="scrollToTop" />
        </div>
        <div class="top-right">
          <template v-if="!userStore.isLoggedIn">
            <el-button type="primary" round @click="$router.push('/login')"><el-icon><User /></el-icon><span>登录</span></el-button>
          </template>
          <template v-else>
            <UserMenu />
          </template>
        </div>
      </div>
    </header>
    <main class="body-area">
      <section v-if="heroProjects.length" class="hero-section">
        <div v-for="(p, i) in heroProjects" :key="p.id" class="hero-card"
             :style="{ background: p.gradient_color || defaultGradient, '--i': i }"
             @click="handleHeroClick(p)">
          <div class="hero-icon">
            <img v-if="p.icon_type==='image'&&p.thumbnail" :src="p.thumbnail" :alt="p.name" />
            <span v-else-if="p.icon_type==='emoji'&&p.icon_emoji">{{ p.icon_emoji }}</span>
            <el-icon v-else size="32" color="rgba(255,255,255,0.9)"><Monitor /></el-icon>
          </div>
          <div class="hero-body">
            <h3>{{ p.name }}</h3>
            <p>{{ p.subtitle || p.description || '进入项目' }}</p>
          </div>
          <el-icon class="hero-arrow" size="20"><ArrowRight /></el-icon>
          <button v-if="userStore.isAdmin" class="hero-edit-btn" @click.stop="openHeroEdit(p)" title="编辑色块"><el-icon size="14"><Edit /></el-icon></button>
        </div>
      </section>

      <div class="tab-header">
        <div class="tabs">
          <button v-for="cat in displayCategories" :key="cat.key" class="tab-btn" :class="{ active: activeTab === cat.key }" @click="activeTab = cat.key">
            {{ cat.label }}
          </button>
        </div>
        <div class="tab-actions" v-if="userStore.isAdmin && activeTab !== 'favorites'">
          <el-button :icon="Plus" size="small" round @click="openAddLink">添加</el-button>
        </div>
      </div>

      <div class="links-grid" v-loading="loading">
        <div v-for="(link, i) in currentLinks" :key="link.id" class="link-card" :style="{ '--i': i }" @click="handleLinkClick(link)">
          <div class="card-icon">
            <img v-if="link.icon_image" :src="link.icon_image" :alt="link.name" />
            <LetterAvatar v-else-if="!link.icon_emoji" :name="link.name" :size="40" />
            <span v-else class="card-emoji">{{ link.icon_emoji }}</span>
          </div>
          <div class="card-body"><h4>{{ link.name }}</h4><p>{{ link.description || '暂无描述' }}</p></div>
          <div class="card-footer"><span>{{ link.is_internal ? '内部' : link.url }}</span><el-icon size="14"><ArrowRight /></el-icon></div>
          <button class="heart-btn" :class="{ fav: link.is_favorited }" @click.stop="toggleFav(link)"><svg viewBox="0 0 24 24" class="heart-svg" :fill="link.is_favorited?'#FF3B30':'none'" :stroke="link.is_favorited?'#FF3B30':'#AEAEB2'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
          <div v-if="userStore.isAdmin&&activeTab!=='favorites'" class="card-admin">
            <button class="adm-btn" title="编辑" @click.stop="openEditLink(link)"><el-icon size="14"><Edit /></el-icon></button>
            <button class="adm-btn del" title="删除" @click.stop="deleteLink(link)"><el-icon size="14"><Delete /></el-icon></button>
          </div>
        </div>
        <EmptyState v-if="!loading && !currentLinks.length" :description="activeTab==='favorites'?'还没有收藏任何链接':'暂无链接'" />
      </div>
    </main>

    <el-dialog v-model="dlg.visible" :title="dlg.title" width="520px" :close-on-click-modal="false">
      <el-form :model="dlg.form" label-width="80px">
        <el-form-item label="名称" required><el-input v-model="dlg.form.name" maxlength="100" /></el-form-item>
        <el-form-item label="链接" required><el-input v-model="dlg.form.url" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="dlg.form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="分类"><el-select v-model="dlg.form.category"><el-option v-for="o in categoryOpts" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="dlg.form.sort_order" :min="0" :max="9999" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dlg.visible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitLink">{{ dlg.editing?'保存':'添加' }}</el-button></template>
    </el-dialog>

    <el-dialog v-model="heroDlg.visible" title="编辑色块" width="480px">
      <el-form :model="heroDlg.form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="heroDlg.form.name" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="heroDlg.form.subtitle" /></el-form-item>
        <el-form-item label="路由"><el-input v-model="heroDlg.form.route" /></el-form-item>
        <el-form-item label="渐变色"><el-input v-model="heroDlg.form.gradient_color" placeholder="linear-gradient(135deg, #4F46E5, #7C3AED)" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="heroDlg.visible=false">取消</el-button><el-button type="primary" :loading="heroSaving" @click="submitHero">保存</el-button></template>
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

const defaultGradient = 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'

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

const dlg = reactive({ visible: false, title: '', editing: false, form: { id: 0, name: '', url: '', description: '', category: 'common_sites', sort_order: 0, is_internal: false } })
const heroDlg = reactive({ visible: false, form: { id: 0, name: '', subtitle: '', route: '', gradient_color: '' } })

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

async function loadData() {
  loading.value = true
  try {
    const [projects, ...linkResults] = await Promise.all([
      projectsApi.getProjects().catch(() => []),
      ...displayCategories.map(c => navigationApi.getLinks({ category: c.key }).catch(() => []))
    ])
    heroProjects.value = (projects as any[]).filter((p: any) => p.is_featured).map((p: any) => ({
      ...p, gradient_color: p.gradient_color || defaultGradient
    }))
    displayCategories.forEach((c, i) => { allLinks[c.key] = (linkResults[i] as any[]) || [] })
  } catch { /* silent */ } finally { loading.value = false }
}

function handleHeroClick(p: any) {
  if (p.route.startsWith('http')) window.open(p.route, '_blank')
  else router.push(p.route)
}

function handleLinkClick(link: any) {
  if (link.is_internal) router.push(link.url)
  else window.open(link.url, '_blank')
}

async function toggleFav(link: any) {
  if (!userStore.isLoggedIn) { router.push('/login'); return }
  try {
    const res = await navigationApi.toggleFavorite(link.id)
    link.is_favorited = res.is_favorited
  } catch { /* silent */ }
}

function openAddLink() {
  dlg.editing = false; dlg.title = '添加链接'
  dlg.form = { id: 0, name: '', url: '', description: '', category: activeTab.value, sort_order: 0, is_internal: false }
  dlg.visible = true
}

function openEditLink(link: any) {
  dlg.editing = true; dlg.title = '编辑链接'
  dlg.form = { id: link.id, name: link.name, url: link.url, description: link.description || '', category: link.category, sort_order: link.sort_order || 0, is_internal: link.is_internal }
  dlg.visible = true
}

async function submitLink() {
  if (!dlg.form.name || !dlg.form.url) { ElMessage.warning('请填写名称和链接'); return }
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
    allLinks[dlg.form.category] = data as any[]
    activeTab.value = dlg.form.category
  } catch { /* handled by interceptor */ } finally { saving.value = false }
}

async function deleteLink(link: any) {
  try {
    await ElMessageBox.confirm(`确定删除"${link.name}"？`, '提示', { type: 'warning' })
    await navigationApi.deleteLink(link.id)
    allLinks[activeTab.value] = allLinks[activeTab.value].filter(l => l.id !== link.id)
  } catch { /* cancelled */ }
}

function openHeroEdit(p: any) {
  heroDlg.form = { id: p.id, name: p.name, subtitle: p.subtitle || '', route: p.route, gradient_color: p.gradient_color || '' }
  heroDlg.visible = true
}

async function submitHero() {
  heroSaving.value = true
  try {
    await projectsApi.updateProject(heroDlg.form.id, heroDlg.form)
    const idx = heroProjects.value.findIndex(p => p.id === heroDlg.form.id)
    if (idx >= 0) Object.assign(heroProjects.value[idx], heroDlg.form)
    heroDlg.visible = false
    ElMessage.success('已保存')
  } catch { /* handled */ } finally { heroSaving.value = false }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
@import '@/styles/tokens.scss';
.home-page { min-height: 100vh; overflow-y: auto; height: 100vh; background: var(--bg-page); background-image: radial-gradient(circle, var(--bg-texture) 1px, transparent 1px); background-size: 24px 24px; }
.top-bar { position: sticky; top: 0; z-index: var(--z-sticky); height: 56px; background: var(--color-bg-overlay); backdrop-filter: var(--blur-sm); -webkit-backdrop-filter: var(--blur-sm); border-bottom: 1px solid var(--color-border-light); }
.top-content { max-width: 1400px; margin: 0 auto; height: 100%; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
.top-left { display: flex; align-items: center; gap: 12px; }
.top-right { display: flex; align-items: center; gap: 16px; }
.body-area { max-width: 1200px; margin: 0 auto; padding: 24px 32px; }
.hero-section { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 32px; }
.hero-card { flex: 1 1 300px; min-width: 280px; max-width: 400px; height: 200px; border-radius: 18px; padding: 24px; cursor: pointer; display: flex; flex-direction: column; gap: 12px; position: relative; overflow: hidden; color: #fff; transition: all 0.3s cubic-bezier(0.25,0.46,0.45,0.94); animation: featuredSlideIn 0.5s ease backwards; animation-delay: calc(var(--i)*0.1s + 0.1s); &:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 40px rgba(0,0,0,0.15); } }
.hero-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 28px; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; } }
.hero-body { flex: 1; h3 { font-size: 18px; font-weight: 700; margin: 0; } p { font-size: 13px; opacity: 0.75; margin: 4px 0 0; } }
.hero-arrow { position: absolute; bottom: 20px; right: 20px; opacity: 0.6; transition: all 0.2s; }
.hero-card:hover .hero-arrow { opacity: 1; transform: translateX(4px); }
.hero-edit-btn { position: absolute; top: 16px; right: 16px; width: 28px; height: 28px; border-radius: 8px; border: none; background: rgba(255,255,255,0.25); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; &:hover { background: rgba(255,255,255,0.4); } }
.hero-card:hover .hero-edit-btn { opacity: 1; }
.tab-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.tabs { display: flex; gap: 4px; background: rgba(0,0,0,0.04); border-radius: 10px; padding: 4px; }
.tab-btn { padding: 7px 18px; border: none; background: transparent; border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s; &.active { background: var(--color-bg-primary); color: var(--color-text-primary); font-weight: 600; box-shadow: var(--shadow-xs); } }
.links-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.link-card { position: relative; background: #fff; border-radius: 14px; padding: 18px; cursor: pointer; transition: all 0.25s; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 10px; min-height: 140px; animation: slideInUp 0.4s ease backwards; animation-delay: calc(var(--i)*0.04s); &:hover { transform: scale(1.03) translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: rgba(0,122,255,0.2); } }
.card-icon { width: 40px; height: 40px; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.03); img { width: 100%; height: 100%; object-fit: cover; } }
.card-emoji { font-size: 24px; }
.card-body { flex: 1; h4 { font-size: 15px; font-weight: 600; margin: 0 0 4px; color: var(--color-text-primary); } p { font-size: 13px; color: var(--color-text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; } }
.card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--color-text-tertiary); span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; } }
.heart-btn { position: absolute; top: 14px; right: 14px; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; background: none; &:hover { background: rgba(255,59,48,0.1); } &.fav .heart-svg { animation: heartPulse 0.4s ease; } }
.heart-svg { width: 18px; height: 18px; transition: all 0.2s; }
.card-admin { position: absolute; bottom: 14px; right: 14px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
.link-card:hover .card-admin { opacity: 1; }
.adm-btn { width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--color-border-light); background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); &:hover { color: var(--color-accent); border-color: var(--color-accent); } &.del:hover { color: var(--color-danger); border-color: var(--color-danger); } }
@media (max-width: 768px) { .body-area { padding: 16px; } .hero-section { flex-direction: column; } .hero-card { min-width: auto; max-width: none; } .links-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; } }
</style>
