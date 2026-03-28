<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="avatar-section">
            <div class="avatar">{{ userStore.user?.username?.charAt(0)?.toUpperCase() || '?' }}</div>
            <h3 class="username">{{ userStore.user?.username || '未设置' }}</h3>
            <el-tag :type="userStore.user?.emailVerified ? 'success' : 'warning'" size="small">
              {{ userStore.user?.emailVerified ? '邮箱已验证' : '邮箱未验证' }}
            </el-tag>
          </div>
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ userStore.user?.email || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">注册时间</span>
              <span class="info-value">{{ userStore.user?.createdAt ? new Date(userStore.user.createdAt).toLocaleDateString() : '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">当前计划</span>
              <span class="info-value">
                <el-tag size="small" effect="dark">{{ planLabel }}</el-tag>
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <h3 style="color:#f7fafc;margin-bottom:20px;">📝 编辑资料</h3>
          <el-form :model="form" label-width="100px" label-position="left">
            <el-form-item label="用户名">
              <el-input v-model="form.username" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input :model-value="userStore.user?.email || ''" disabled>
                <template #suffix><el-tag size="small" :type="userStore.user?.emailVerified ? 'success' : 'warning'">{{ userStore.user?.emailVerified ? '已验证' : '未验证' }}</el-tag></template>
              </el-input>
            </el-form-item>
            <el-form-item label="投资风格">
              <el-select v-model="form.profile.investmentStyle" style="width:100%">
                <el-option label="保守型" value="conservative" />
                <el-option label="稳健型" value="balanced" />
                <el-option label="激进型" value="aggressive" />
                <el-option label="日内交易" value="day_trader" />
                <el-option label="长期持有" value="long_term" />
              </el-select>
            </el-form-item>
            <el-form-item label="经验水平">
              <el-select v-model="form.profile.experience" style="width:100%">
                <el-option label="入门" value="beginner" />
                <el-option label="中级" value="intermediate" />
                <el-option label="高级" value="advanced" />
                <el-option label="专业" value="professional" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top:20px;">
          <h3 style="color:#f7fafc;margin-bottom:20px;">🔒 修改密码</h3>
          <el-form :model="pwdForm" label-width="100px" label-position="left">
            <el-form-item label="当前密码">
              <el-input v-model="pwdForm.currentPassword" type="password" show-password placeholder="请输入当前密码" />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少8位，含大小写字母和数字" />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="danger" :loading="changingPwd" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import { API_BASE } from '../utils/config'
import axios from 'axios'

const userStore = useUserStore()
const saving = ref(false)
const changingPwd = ref(false)
const form = reactive({
  username: userStore.user?.username || '',
  profile: {
    investmentStyle: userStore.user?.profile?.investmentStyle || 'balanced',
    experience: userStore.user?.profile?.experience || 'intermediate'
  }
})
const pwdForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

const planLabel = computed(() => {
  const plans = { free: '免费版', starter: '入门版', pro: '专业版', enterprise: '企业版' }
  return plans[userStore.user?.subscription?.plan] || '免费版'
})

const save = async () => {
  saving.value = true
  try {
    await userStore.updateProfile(form)
    ElMessage.success('资料保存成功')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally { saving.value = false }
}

const changePassword = async () => {
  if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
    return ElMessage.warning('请填写完整的密码信息')
  }
  if (pwdForm.newPassword.length < 8 || !/[A-Z]/.test(pwdForm.newPassword) || !/[a-z]/.test(pwdForm.newPassword) || !/[0-9]/.test(pwdForm.newPassword)) {
    return ElMessage.warning('新密码至少8位，需包含大小写字母和数字')
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    return ElMessage.warning('两次输入的密码不一致')
  }
  changingPwd.value = true
  try {
    await axios.put(`${API_BASE}/auth/change-password`, {
      currentPassword: pwdForm.currentPassword,
      newPassword: pwdForm.newPassword
    }, { headers: { Authorization: `Bearer ${userStore.token}` } })
    ElMessage.success('密码修改成功')
    pwdForm.currentPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '密码修改失败')
  } finally { changingPwd.value = false }
}
</script>

<style scoped>
.profile-card { text-align: center; }
.avatar-section { padding: 20px 0; border-bottom: 1px solid #2d2d44; margin-bottom: 16px; }
.avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #e94560, #ff6b6b); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: white; margin: 0 auto 12px; }
.username { color: #f7fafc; margin-bottom: 8px; }
.info-section { text-align: left; }
.info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2d2d44; font-size: 13px; }
.info-label { color: #718096; }
.info-value { color: #e2e8f0; }
:deep(.el-form-item__label) { color: #a0aec0; }
:deep(.el-input__wrapper) { background: #16213e; border-color: #2d2d44; box-shadow: none; }
:deep(.el-input__inner) { color: #e2e8f0; }
:deep(.el-input.is-disabled .el-input__wrapper) { background: #1a1a2e; }
</style>
