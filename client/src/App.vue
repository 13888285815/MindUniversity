<template>
  <div id="app">
    <el-container v-if="isAuthenticated" class="app-container">
      <el-header class="app-header" height="60px">
        <div class="header-content">
          <div class="logo" @click="$router.push('/')">
            <span class="logo-icon">📈</span>
            <span class="logo-text">智慧证券</span>
          </div>
          <el-menu :default-active="activeMenu" mode="horizontal" router class="nav-menu" background-color="#1a1a2e" text-color="#a0aec0" active-text-color="#e94560">
            <el-menu-item index="/dashboard">行情中心</el-menu-item>
            <el-menu-item index="/stock">个股分析</el-menu-item>
            <el-menu-item index="/watchlist">自选股</el-menu-item>
            <el-menu-item index="/ai">AI分析</el-menu-item>
            <el-menu-item index="/alerts">预警</el-menu-item>
            <el-menu-item index="/customer-service">
              <el-badge is-dot class="customer-service-badge">智能客服</el-badge>
            </el-menu-item>
          </el-menu>
          <div class="user-section">
            <el-badge :value="user?.tokenBalance || 0" :max="999999" class="token-badge">
              <el-tooltip content="Token余额">
                <el-icon :size="20" color="#f6ad55"><Coin /></el-icon>
              </el-tooltip>
            </el-badge>
            <el-tag :type="planTagType" size="small" effect="dark">{{ planLabel }}</el-tag>
            <el-dropdown @command="handleCommand">
              <span class="user-name">{{ user?.username }} <el-icon><ArrowDown /></el-icon></span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item command="api-keys">API Keys</el-dropdown-item>
                  <el-dropdown-item command="billing">Token & 计费</el-dropdown-item>
                  <el-dropdown-item command="subscription">订阅管理</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
    <router-view v-else />

    <!-- 智能客服悬浮按钮 -->
    <CustomerServiceButton v-if="isAuthenticated" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from './store/user'
import CustomerServiceButton from './components/CustomerServiceButton.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const user = computed(() => userStore.user)
const isAuthenticated = computed(() => userStore.isAuthenticated)
const activeMenu = computed(() => route.path)

const planLabel = computed(() => {
  const plans = { free: '免费版', starter: '入门版', pro: '专业版', enterprise: '企业版' }
  return plans[user.value?.subscription?.plan] || '免费版'
})

const planTagType = computed(() => {
  const types = { free: 'info', starter: '', pro: 'success', enterprise: 'warning' }
  return types[user.value?.subscription?.plan] || 'info'
})

onMounted(() => { userStore.loadUser() })

const handleCommand = (cmd) => {
  const routes = { profile: '/profile', 'api-keys': '/api-keys', billing: '/billing', subscription: '/subscription', logout: null }
  if (cmd === 'logout') { userStore.logout(); router.push('/login') }
  else if (routes[cmd]) router.push(routes[cmd])
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
#app { min-height: 100vh; background: #0f0f23; color: #e2e8f0; }
.app-container { min-height: 100vh; }
.app-header { background: #1a1a2e; box-shadow: 0 2px 10px rgba(0,0,0,0.3); padding: 0; z-index: 100; }
.header-content { display: flex; align-items: center; justify-content: space-between; max-width: 1600px; margin: 0 auto; padding: 0 20px; height: 100%; }
.logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.logo-icon { font-size: 24px; }
.logo-text { font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #e94560, #ff6b6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.nav-menu { flex: 1; margin: 0 30px; border-bottom: none !important; }
.nav-menu .el-menu-item { font-size: 14px; }
.user-section { display: flex; align-items: center; gap: 15px; }
.user-name { cursor: pointer; color: #a0aec0; font-size: 14px; display: flex; align-items: center; gap: 4px; }
.token-badge { cursor: pointer; }
.customer-service-badge { position: relative; }
.customer-service-badge :deep(.el-badge__content) { right: 0; }
.app-main { max-width: 1600px; margin: 0 auto; padding: 20px; width: 100%; }
.el-card { background: #1a1a2e; border: 1px solid #2d2d44; color: #e2e8f0; }
.el-card__header { border-bottom: 1px solid #2d2d44; color: #e2e8f0; }
</style>
