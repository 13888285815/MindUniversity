<template>
  <div class="verify-page">
    <div class="verify-card">
      <h2>邮箱验证</h2>
      <p v-if="!verified">{{ message }}</p>
      <el-result v-if="verified" icon="success" title="邮箱验证成功" sub-title="您可以开始使用智慧证券的全部功能">
        <template #extra><el-button type="primary" @click="$router.push('/dashboard')">进入行情中心</el-button></template>
      </el-result>
      <el-result v-else-if="error" icon="error" title="验证失败" :sub-title="message">
        <template #extra><el-button @click="$router.push('/login')">返回登录</el-button></template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const verified = ref(false)
const error = ref(false)
const message = ref('正在验证...')

onMounted(async () => {
  try {
    const { token, email } = route.query
    if (!token || !email) { error.value = true; message.value = '验证链接无效'; return }
    const res = await axios.post('http://localhost:3000/api/auth/verify-email', { token, email })
    verified.value = true
  } catch (e) {
    error.value = true
    message.value = e.response?.data?.message || '验证失败'
  }
})
</script>

<style scoped>
.verify-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f0f23; }
.verify-card { width: 400px; padding: 40px; background: #1a1a2e; border-radius: 16px; border: 1px solid #2d2d44; text-align: center; }
.verify-card h2 { color: #f7fafc; margin-bottom: 20px; }
.verify-card p { color: #a0aec0; }
</style>
