<template>
  <MainLayout>
    <div class="user-management">
      <div class="page-header">
        <h1 class="page-title">用户管理</h1>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新增用户</el-button>
      </div>

      <el-card class="user-table-card" v-loading="loading">
        <el-table :data="users" style="width: 100%">
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="email" label="邮箱" min-width="180" />
          <el-table-column prop="role_display" label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
                {{ row.role_display }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="last_login" label="最后登录" width="180">
            <template #default="{ row }">
              {{ row.last_login ? formatDate(row.last_login) : '从未登录' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openResetDialog(row)">重置密码</el-button>
              <el-button
                size="small"
                type="danger"
                :disabled="row.username === 'admin'"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 新增用户对话框 -->
      <el-dialog v-model="addDialogVisible" title="新增用户" width="480px">
        <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="80px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="addForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="addForm.password" type="password" placeholder="至少8位，含字母和数字" show-password />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="addForm.email" placeholder="邮箱地址" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="addForm.phone" placeholder="手机号码" />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="addForm.role" style="width: 100%">
              <el-option label="普通用户" value="user" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAdd" :loading="adding">添加</el-button>
        </template>
      </el-dialog>

      <!-- 重置密码对话框 -->
      <el-dialog v-model="resetDialogVisible" title="重置密码" width="440px">
        <p class="reset-hint">为用户 <strong>{{ currentUser?.username }}</strong> 重置密码</p>
        <el-form :model="resetForm" :rules="resetRules" ref="resetFormRef" label-width="80px">
          <el-form-item label="新密码" prop="new_password">
            <el-input v-model="resetForm.new_password" type="password" placeholder="至少8位，含字母和数字" show-password />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="resetDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleReset" :loading="resetting">重置</el-button>
        </template>
      </el-dialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import MainLayout from '@/layouts/MainLayout.vue'
import { authApi } from '@/api/auth'
import dayjs from 'dayjs'

const loading = ref(false)
const adding = ref(false)
const resetting = ref(false)
const users = ref<any[]>([])

const addDialogVisible = ref(false)
const resetDialogVisible = ref(false)
const currentUser = ref<any>(null)

const addFormRef = ref<FormInstance>()
const resetFormRef = ref<FormInstance>()

const addForm = reactive({
  username: '',
  password: '',
  email: '',
  phone: '',
  role: 'user'
})

const resetForm = reactive({
  new_password: ''
})

const passwordValidator = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else {
    callback()
  }
}

const addRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, validator: passwordValidator, trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const resetRules: FormRules = {
  new_password: [{ required: true, validator: passwordValidator, trigger: 'blur' }]
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchUsers() {
  loading.value = true
  try {
    const data = await authApi.getUsers()
    users.value = Array.isArray(data) ? data : []
  } catch (error) {
    users.value = []
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  Object.assign(addForm, { username: '', password: '', email: '', phone: '', role: 'user' })
  addDialogVisible.value = true
}

function openResetDialog(user: any) {
  currentUser.value = user
  resetForm.new_password = ''
  resetDialogVisible.value = true
}

async function handleAdd() {
  if (!addFormRef.value) return
  await addFormRef.value.validate(async (valid) => {
    if (!valid) return
    adding.value = true
    try {
      await authApi.createUser(addForm)
      ElMessage.success('用户添加成功')
      addDialogVisible.value = false
      fetchUsers()
    } catch (error) {
      // 错误已在拦截器处理
    } finally {
      adding.value = false
    }
  })
}

async function handleReset() {
  if (!resetFormRef.value || !currentUser.value) return
  await resetFormRef.value.validate(async (valid) => {
    if (!valid) return
    resetting.value = true
    try {
      await authApi.resetPassword(currentUser.value.id, resetForm)
      ElMessage.success('密码重置成功')
      resetDialogVisible.value = false
    } catch (error) {
      // 错误已在拦截器处理
    } finally {
      resetting.value = false
    }
  })
}

async function handleDelete(user: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    await authApi.deleteUser(user.id)
    ElMessage.success('用户删除成功')
    fetchUsers()
  } catch (error) {
    // 用户取消或错误
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped lang="scss">
.user-management {
  padding: 32px 48px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1C1C1E;
}

.user-table-card {
  border-radius: 16px;
  border: 1px solid #E5E5EA;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.reset-hint {
  font-size: 14px;
  color: #86868B;
  margin-bottom: 16px;
}
</style>
