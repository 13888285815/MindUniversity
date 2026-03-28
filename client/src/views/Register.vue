<template>
  <div class="register-page">
    <div class="register-card">
      <h2>注册智慧证券</h2>
      <el-form :model="form" @submit.prevent="handleRegister">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.email" placeholder="邮箱地址" prefix-icon="Message" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码 (至少8位，含大小写字母和数字)" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" round style="width:100%;" :loading="loading" @click="handleRegister">注册</el-button>
      </el-form>
      <div class="reg-footer">已有账号？<router-link to="/login">立即登录</router-link></div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const form = reactive({ username: '', email: '', password: '' })

const handleRegister = async () => {
  if (!form.username || !form.email || !form.password) return ElMessage.warning('请填写完整信息')
  loading.value = true
  try {
    await userStore.register(form)
    ElMessage.success('注册成功！验证邮件已发送，请查收邮箱')
    router.push('/login')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '注册失败')
  } finally { loading.value = false }
}
</script>

<style scoped>
.register-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f0f23; }
.register-card { width: 400px; padding: 40px; background: #1a1a2e; border-radius: 16px; border: 1px solid #2d2d44; }
.register-card h2 { text-align: center; color: #f7fafc; margin-bottom: 30px; }
.reg-footer { text-align: center; margin-top: 20px; color: #718096; font-size: 14px; }
.reg-footer a { color: #e94560; text-decoration: none; }
:deep(.el-input__wrapper) { background: #16213e; border-color: #2d2d44; box-shadow: none; }
:deep(.el-input__inner) { color: #e2e8f0; }
</style>
