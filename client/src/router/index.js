import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue'), meta: { requiresAuth: false } },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { requiresAuth: false } },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue'), meta: { requiresAuth: false } },
  { path: '/verify-email', name: 'VerifyEmail', component: () => import('../views/VerifyEmail.vue'), meta: { requiresAuth: false } },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/stock', name: 'Stock', component: () => import('../views/Stock.vue'), meta: { requiresAuth: true } },
  { path: '/watchlist', name: 'Watchlist', component: () => import('../views/Watchlist.vue'), meta: { requiresAuth: true } },
  { path: '/ai', name: 'AIAnalysis', component: () => import('../views/AIAnalysis.vue'), meta: { requiresAuth: true } },
  { path: '/alerts', name: 'Alerts', component: () => import('../views/Alerts.vue'), meta: { requiresAuth: true } },
  { path: '/api-keys', name: 'APIKeys', component: () => import('../views/APIKeys.vue'), meta: { requiresAuth: true } },
  { path: '/billing', name: 'Billing', component: () => import('../views/Billing.vue'), meta: { requiresAuth: true } },
  { path: '/subscription', name: 'Subscription', component: () => import('../views/Subscription.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isAuthenticated) next('/login')
  else if ((to.path === '/login' || to.path === '/register') && userStore.isAuthenticated) next('/dashboard')
  else next()
})

export default router
