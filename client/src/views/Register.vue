<template>
  <div class="register-page">
    <div class="register-background">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="register-container">
      <div class="register-card">
        <div class="card-header">
          <h2>创建账户</h2>
          <p>注册智慧证券，开始智能投资之旅</p>
        </div>

        <el-form
          :model="form"
          :rules="rules"
          ref="registerFormRef"
          @submit.prevent="handleRegister"
          label-position="top"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="3-20个字符"
              prefix-icon="User"
              size="large"
              clearable
              maxlength="20"
            />
          </el-form-item>

          <el-form-item label="邮箱地址" prop="email">
            <el-input
              v-model="form.email"
              placeholder="your@email.com"
              prefix-icon="Message"
              size="large"
              clearable
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="至少8位，含大小写字母和数字"
              prefix-icon="Lock"
              size="large"
              show-password
              maxlength="32"
            />
            <div class="password-tips" v-if="form.password">
              <span :class="pwdChecks.lowercase ? 'tip-ok' : 'tip-fail'">● 小写字母</span>
              <span :class="pwdChecks.uppercase ? 'tip-ok' : 'tip-fail'">● 大写字母</span>
              <span :class="pwdChecks.number ? 'tip-ok' : 'tip-fail'">● 数字</span>
              <span :class="pwdChecks.length ? 'tip-ok' : 'tip-fail'">● 至少8位</span>
            </div>
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            round
            class="register-button"
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form>

        <div class="reg-footer">
          已有账号？
          <router-link to="/login" class="login-link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const registerFormRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 密码强度实时检测
const pwdChecks = computed(() => ({
  lowercase: /[a-z]/.test(form.password),
  uppercase: /[A-Z]/.test(form.password),
  number: /\d/.test(form.password),
  length: form.password.length >= 8
}))

// 自定义确认密码校验
const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名需要3-20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!/[a-z]/.test(value)) { callback(new Error('密码需要包含小写字母')); return }
        if (!/[A-Z]/.test(value)) { callback(new Error('密码需要包含大写字母')); return }
        if (!/\d/.test(value)) { callback(new Error('密码需要包含数字')); return }
        callback()
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  try {
    // 先做前端表单校验
    const valid = await registerFormRef.value.validate()
    if (!valid) return

    loading.value = true
    // 只提交后端需要的字段
    const { confirmPassword, ...registerData } = form
    await userStore.register(registerData)
    ElMessage.success('注册成功！')
    router.push('/dashboard')
  } catch (e) {
    const msg = e.response?.data?.message || e.response?.data?.errors?.join('；') || e.message || '注册失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f0f23;
  position: relative;
  overflow: hidden;
}

.register-background {
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
  width: 400px; height: 400px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  top: -100px; right: -100px;
}

.shape-2 {
  width: 300px; height: 300px;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  bottom: -50px; left: -50px;
  animation-delay: -5s;
}

.shape-3 {
  width: 250px; height: 250px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(30px, -30px); }
  50% { transform: translate(0, -60px); }
  75% { transform: translate(-30px, -30px); }
}

.register-container {
  position: relative;
  z-index: 1;
  max-width: 480px;
  width: 100%;
  padding: 24px;
}

.register-card {
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

/* Form styling */
:deep(.el-form-item__label) {
  color: #a0aec0;
  font-size: 13px;
  font-weight: 500;
  padding-bottom: 4px;
}

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
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #e94560;
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

/* Password strength tips */
.password-tips {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.password-tips span {
  font-size: 12px;
  transition: color 0.3s;
}

.tip-ok {
  color: #48bb78;
}

.tip-fail {
  color: #718096;
}

/* Register button */
.register-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  border: none;
  margin-top: 8px;
  transition: all 0.3s;
}

.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(233, 69, 96, 0.4);
}

/* Footer */
.reg-footer {
  text-align: center;
  margin-top: 24px;
  color: #718096;
  font-size: 14px;
}

.login-link {
  color: #e94560;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: opacity 0.3s;
}

.login-link:hover {
  opacity: 0.8;
}

/* Responsive */
@media (max-width: 640px) {
  .register-card {
    padding: 24px;
  }
  .card-header h2 {
    font-size: 24px;
  }
}
</style>
