<template>
  <div class="subscription-page">
    <h2 style="color:#f7fafc;margin-bottom:24px;">💎 订阅管理</h2>
    <el-row :gutter="20">
      <el-col :span="6" v-for="plan in plans" :key="plan.slug">
        <el-card :class="{ featured: plan.featured }" class="plan-card">
          <div class="plan-badge" v-if="plan.featured">推荐</div>
          <h3>{{ plan.name }}</h3>
          <div class="price">{{ plan.price }}<span>/月</span></div>
          <p class="desc">{{ plan.desc }}</p>
          <ul class="features"><li v-for="f in plan.features" :key="f" :class="{ off: !f.included }"><span>{{ f.included ? '✓' : '—' }}</span> {{ f.name }}</li></ul>
          <el-button :type="currentPlan === plan.slug ? 'info' : 'primary'" round style="width:100%;" @click="subscribe(plan.slug)" :disabled="currentPlan === plan.slug">
            {{ currentPlan === plan.slug ? '当前计划' : '订阅' }}
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

const API = 'http://localhost:3000/api'
const userStore = useUserStore()
const currentPlan = ref('free')
const plans = ref([])

const loadPlans = async () => {
  try {
    const [pRes, sRes] = await Promise.all([axios.get(`${API}/subscription/plans`), axios.get(`${API}/subscription/status`, { headers: { Authorization: `Bearer ${userStore.token}` } })])
    plans.value = pRes.data.data.plans.map(p => ({ ...p, price: p.pricing?.monthly?.amount === 0 ? '免费' : `¥${p.pricing?.monthly?.amount}`, features: p.features?.map(f => ({ name: f.name, included: f.included })), desc: p.description, featured: p.isRecommended }))
    currentPlan.value = sRes.data.data.plan
  } catch (e) {}
}

const subscribe = async (slug) => {
  try { await axios.post(`${API}/subscription/create`, { plan: slug }, { headers: { Authorization: `Bearer ${userStore.token}` } }); ElMessage.success('订阅成功'); loadPlans() } catch (e) { ElMessage.error(e.response?.data?.message) }
}

onMounted(loadPlans)
</script>

<style scoped>
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
