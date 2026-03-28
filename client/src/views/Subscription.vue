<template>
  <div class="subscription-page">
    <h2 style="color:#f7fafc;margin-bottom:24px;">💎 订阅管理</h2>

    <!-- 当前订阅状态 -->
    <el-card v-if="currentSubscription" style="margin-bottom:20px;" class="current-sub">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h3 style="color:#f7fafc;margin-bottom:8px;">当前计划：{{ currentPlanLabel }}</h3>
          <div style="color:#a0aec0;font-size:13px;">
            <span v-if="currentSubscription.expiresAt">到期时间：{{ new Date(currentSubscription.expiresAt).toLocaleDateString() }}</span>
            <span v-if="currentSubscription.autoRenew" style="margin-left:16px;color:#2ed573;">· 自动续费已开启</span>
            <span v-else style="margin-left:16px;color:#ffa502;">· 自动续费已关闭</span>
          </div>
        </div>
        <div v-if="currentPlan !== 'free'">
          <el-button @click="cancelSubscription" type="danger" size="small" plain>取消订阅</el-button>
        </div>
      </div>
    </el-card>

    <!-- 计划列表 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="plan in plans" :key="plan.slug">
        <el-card :class="{ featured: plan.featured }" class="plan-card">
          <div class="plan-badge" v-if="plan.featured">推荐</div>
          <h3>{{ plan.name }}</h3>
          <div class="price">
            {{ plan.price }}<span v-if="plan.price !== '免费'">/月</span>
          </div>
          <p class="desc">{{ plan.desc }}</p>
          <ul class="features">
            <li v-for="f in plan.features" :key="f.name" :class="{ off: !f.included }">
              <span>{{ f.included ? '✓' : '—' }}</span> {{ f.name }}
            </li>
          </ul>
          <el-button
            :type="currentPlan === plan.slug ? 'info' : 'primary'"
            round style="width:100%;"
            @click="subscribe(plan.slug)"
            :disabled="currentPlan === plan.slug"
          >
            {{ currentPlan === plan.slug ? '当前计划' : '订阅' }}
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

import { API_BASE as API } from '../utils/config'
const userStore = useUserStore()
const currentPlan = ref('free')
const currentSubscription = ref(null)
const plans = ref([])

const authHeaders = { headers: { Authorization: `Bearer ${userStore.token}` } }

const planLabels = { free: '免费版', starter: '入门版', pro: '专业版', enterprise: '企业版' }
const currentPlanLabel = computed(() => planLabels[currentPlan.value] || '免费版')

const loadPlans = async () => {
  try {
    const [pRes, sRes] = await Promise.all([
      axios.get(`${API}/subscription/plans`),
      axios.get(`${API}/subscription/status`, authHeaders)
    ])
    plans.value = (pRes.data.data.plans || []).map(p => ({
      ...p,
      price: p.pricing?.monthly?.amount === 0 ? '免费' : `¥${p.pricing?.monthly?.amount}`,
      features: (p.features || []).map(f => ({ name: f.name, included: f.included })),
      desc: p.description,
      featured: p.isRecommended
    }))
    if (sRes.data.data) {
      currentPlan.value = sRes.data.data.plan || 'free'
      currentSubscription.value = sRes.data.data.subscription || sRes.data.data
    }
  } catch (e) {
    console.error('加载订阅数据失败:', e)
    ElMessage.error('加载订阅信息失败')
  }
}

const subscribe = async (slug) => {
  try {
    await axios.post(`${API}/subscription/create`, { plan: slug }, authHeaders)
    ElMessage.success('订阅成功')
    loadPlans()
  } catch (e) { ElMessage.error(e.response?.data?.message || '订阅失败') }
}

const cancelSubscription = async () => {
  try {
    await axios.post(`${API}/subscription/cancel`, {}, authHeaders)
    ElMessage.success('订阅已取消')
    loadPlans()
  } catch (e) { ElMessage.error(e.response?.data?.message || '取消失败') }
}

onMounted(loadPlans)
</script>

<style scoped>
.current-sub { border-color: #e94560; }
.plan-card { text-align: center; border-radius: 14px; }
.plan-card.featured { border-color: #e94560; transform: scale(1.03); }
.plan-badge { background: #e94560; color: white; padding: 2px 14px; border-radius: 10px; font-size: 12px; }
.plan-card h3 { margin: 10px 0; color: #f7fafc; }
.price { font-size: 32px; font-weight: 800; color: #e94560; margin-bottom: 10px; }
.price span { font-size: 14px; color: #718096; font-weight: 400; }
.desc { color: #a0aec0; font-size: 13px; margin-bottom: 16px; }
.features { list-style: none; padding: 0; margin-bottom: 20px; }
.features li { padding: 5px 0; font-size: 13px; color: #a0aec0; }
.features li.off { color: #4a5568; text-decoration: line-through; }
</style>
