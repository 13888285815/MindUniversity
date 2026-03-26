<template>
  <div class="login-page">
    <div class="login-card">
      <h2>登录智慧证券</h2>
      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.email" placeholder="邮箱地址" prefix-icon="Message" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-button type="primary" size="large" round style="width:100%;" :loading="loading" @click="handleLogin">登录</el-button>
      </el-form>
      <div class="login-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
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
const form = reactive({ email: '', password: '' })

const handleLogin = async () => {
  if (!form.email || !form.password) return ElMessage.warning('请输入邮箱和密码')
  loading.value = true
  try {
    await userStore.login(form.email, form.password)
    router.push('/dashboard')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '登录失败')
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f0f23; }
.login-card { width: 400px; padding: 40px; background: #1a1a2e; border-radius: 16px; border: 1px solid #2d2d44; }
.login-card h2 { text-align: center; color: #f7fafc; margin-bottom: 30px; }
.login-footer { text-align: center; margin-top: 20px; color: #718096; font-size: 14px; }
.login-footer a { color: #e94560; text-decoration: none; }
:deep(.el-input__wrapper) { background: #16213e; border-color: #2d2d44; box-shadow: none; }
:deep(.el-input__inner) { color: #e2e8f0; }
:deep(.el-input__inner::placeholder) { color: #4a5568; }
</style>
