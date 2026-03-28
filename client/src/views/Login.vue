<template>
  <div class="login-page">
    <div class="login-background">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>
    
    <div class="login-container">
      <div class="brand-section">
        <div class="brand-logo">
          <span class="logo-icon">📈</span>
          <h1 class="brand-title">智慧证券</h1>
          <p class="brand-subtitle">AI驱动的智能证券分析平台</p>
        </div>
        <div class="feature-list">
          <div class="feature-item">
            <el-icon class="feature-icon"><TrendCharts /></el-icon>
            <span>实时行情数据</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><DataAnalysis /></el-icon>
            <span>AI智能分析</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><Bell /></el-icon>
            <span>智能预警系统</span>
          </div>
        </div>
      </div>

      <div class="login-card">
        <div class="card-header">
          <h2>欢迎回来</h2>
          <p>登录您的账户继续使用</p>
        </div>

        <el-form :model="form" :rules="rules" ref="loginFormRef" @submit.prevent="handleLogin">
          <el-form-item prop="email">
            <el-input 
              v-model="form.email" 
              placeholder="邮箱地址" 
              prefix-icon="Message" 
              size="large"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="form.password" 
              type="password" 
              placeholder="密码" 
              prefix-icon="Lock" 
              size="large" 
              show-password 
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
          </div>

          <el-button 
            type="primary" 
            size="large" 
            round 
            class="login-button"
            :loading="loading" 
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form>

        <el-divider class="divider">或使用以下方式</el-divider>

        <div class="social-login">
          <el-button class="social-button" @click="socialLogin('wechat')">
            <svg class="social-icon" viewBox="0 0 24 24">
              <path fill="#07C160" d="M8.5 13.5c-4.14 0-7.5-2.69-7.5-6s3.36-6 7.5-6 7.5 2.69 7.5 6-3.36 6-7.5 6zm0-10c-2.48 0-4.5 1.79-4.5 4s2.02 4 4.5 4 4.5-1.79 4.5-4-2.02-4-4.5-4zm7 14c-3.31 0-6-2.24-6-5s2.69-5 6-5 6 2.24 6 5-2.69 5-6 5zm0-8c-1.93 0-3.5 1.34-3.5 3s1.57 3 3.5 3 3.5-1.34 3.5-3-1.57-3-3.5-3z"/>
            </svg>
            微信登录
          </el-button>
        </div>

        <div class="login-footer">
          还没有账号？
          <router-link to="/register" class="register-link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import { TrendCharts, DataAnalysis, Bell } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)
const rememberMe = ref(false)
const isAuthenticated = computed(() => userStore.isAuthenticated)

const form = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    loading.value = true
    await userStore.login(form.email, form.password)
    
    if (rememberMe.value) {
      localStorage.setItem('rememberEmail', form.email)
    } else {
      localStorage.removeItem('rememberEmail')
    }

    ElMessage.success('登录成功，欢迎回来！')
    
    // 跳转到之前的页面或首页
    const redirect = router.currentRoute.value.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (error) {
    const message = error.response?.data?.message || error.message || '登录失败，请检查您的账号密码'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

const socialLogin = (provider) => {
  ElMessage.info(`${provider === 'wechat' ? '微信' : ''}登录功能即将上线`)
}

// 自动填充记住的邮箱
onMounted(() => {
  const rememberedEmail = localStorage.getItem('rememberEmail')
  if (rememberedEmail) {
    form.email = rememberedEmail
    rememberMe.value = true
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f0f23;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  bottom: -50px;
  right: -50px;
  animation-delay: -5s;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(30px, -30px) rotate(90deg); }
  50% { transform: translate(0, -60px) rotate(180deg); }
  75% { transform: translate(-30px, -30px) rotate(270deg); }
}

.login-container {
  display: flex;
  gap: 80px;
  align-items: center;
  max-width: 1200px;
  width: 100%;
  padding: 40px;
  position: relative;
  z-index: 1;
}

/* 品牌区域 */
.brand-section {
  flex: 1;
  max-width: 480px;
}

.brand-logo {
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.brand-title {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 18px;
  color: #718096;
  margin-top: 12px;
  line-height: 1.6;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.3s;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(233, 69, 96, 0.3);
  transform: translateX(8px);
}

.feature-icon {
  font-size: 24px;
  color: #e94560;
}

.feature-item span {
  font-size: 16px;
  color: #e2e8f0;
}

/* 登录卡片 */
.login-card {
  width: 420px;
  padding: 48px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(45, 45, 68, 0.6);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.card-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #f7fafc;
  margin: 0 0 8px 0;
}

.card-header p {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

/* 表单样式 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  background: rgba(22, 33, 62, 0.6);
  border-color: rgba(45, 45, 68, 0.6);
  box-shadow: none;
  padding: 12px 16px;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(233, 69, 96, 0.4);
  background: rgba(22, 33, 62, 0.8);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #e94560;
  background: rgba(22, 33, 62, 0.8);
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
}

:deep(.el-input__inner) {
  color: #e2e8f0;
  font-size: 15px;
}

:deep(.el-input__inner::placeholder) {
  color: #4a5568;
}

:deep(.el-input__prefix-inner) {
  color: #718096;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

:deep(.el-checkbox) {
  color: #718096;
  font-size: 14px;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #e94560;
  border-color: #e94560;
}

.forgot-link {
  color: #e94560;
  text-decoration: none;
  font-size: 14px;
  transition: opacity 0.3s;
}

.forgot-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  border: none;
  transition: all 0.3s;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(233, 69, 96, 0.4);
}

:deep(.el-button.is-loading) {
  background: linear-gradient(135deg, #e94560, #ff6b6b);
}

.divider {
  margin: 32px 0;
}

:deep(.el-divider__text) {
  color: #4a5568;
  font-size: 13px;
  background: transparent;
}

:deep(.el-divider--horizontal) {
  border-color: rgba(45, 45, 68, 0.4);
}

/* 社交登录 */
.social-login {
  margin-bottom: 24px;
}

.social-button {
  width: 100%;
  height: 44px;
  background: rgba(22, 33, 62, 0.6);
  border: 1px solid rgba(45, 45, 68, 0.6);
  color: #e2e8f0;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.social-button:hover {
  background: rgba(7, 193, 96, 0.1);
  border-color: #07c160;
  color: #07c160;
  transform: translateY(-2px);
}

.social-icon {
  width: 20px;
  height: 20px;
}

/* 页脚 */
.login-footer {
  text-align: center;
  color: #718096;
  font-size: 14px;
  line-height: 1.6;
}

.register-link {
  color: #e94560;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: opacity 0.3s;
}

.register-link:hover {
  opacity: 0.8;
}

/* 响应式 */
@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
    gap: 40px;
    max-width: 500px;
    padding: 24px;
  }

  .brand-section {
    text-align: center;
    max-width: 100%;
  }

  .feature-list {
    align-items: center;
  }

  .brand-title {
    font-size: 36px;
  }

  .login-card {
    width: 100%;
    padding: 32px;
  }

  .bg-shape {
    opacity: 0.2;
  }
}

@media (max-width: 640px) {
  .brand-title {
    font-size: 28px;
  }

  .brand-subtitle {
    font-size: 16px;
  }

  .logo-icon {
    font-size: 48px;
  }

  .feature-item {
    padding: 12px 16px;
  }

  .login-card {
    padding: 24px;
  }

  .card-header h2 {
    font-size: 24px;
  }
}
</style>
