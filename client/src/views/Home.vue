<template>
  <div class="home">
    <!-- 未登录时显示的落地页 -->
    <div v-if="!userStore.isAuthenticated" class="landing">
      <header class="landing-header">
        <div class="brand" @click="$router.push('/')">
          <span class="brand-icon">📈</span>
          <span class="brand-text">智慧证券</span>
        </div>
        <div class="header-actions">
          <el-button @click="$router.push('/market')" round>行情</el-button>
          <el-button @click="$router.push('/login')" round>登录</el-button>
          <el-button type="primary" @click="$router.push('/register')" round>免费注册</el-button>
        </div>
      </header>

      <section class="hero">
        <div class="hero-bg-effects">
          <div class="bg-orb orb-1"></div>
          <div class="bg-orb orb-2"></div>
          <div class="bg-orb orb-3"></div>
        </div>
        <div class="hero-content">
          <div class="hero-badge">AI + 实时行情 + 智能分析</div>
          <h1>
            <span class="line1">重新定义</span>
            <span class="line2 gradient-text">智能证券分析</span>
          </h1>
          <p class="subtitle">集银河证券智慧星专业行情 + 同花顺极致体验 + AI深度分析，为投资者提供一站式解决方案</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="$router.push('/register')" round>
              免费开始体验 <span class="btn-arrow">→</span>
            </el-button>
            <el-button size="large" @click="scrollToFeatures" round>了解更多</el-button>
          </div>
          <div class="stats-bar">
            <div class="stat-item"><span class="stat-num" data-target="5000">5000+</span><span class="stat-label">覆盖标的</span></div>
            <div class="stat-divider"></div>
            <div class="stat-item"><span class="stat-num">实时</span><span class="stat-label">行情推送</span></div>
            <div class="stat-divider"></div>
            <div class="stat-item"><span class="stat-num">AI</span><span class="stat-label">深度分析</span></div>
            <div class="stat-divider"></div>
            <div class="stat-item"><span class="stat-num">4层</span><span class="stat-label">订阅体系</span></div>
          </div>
        </div>
      </section>

      <section class="features" id="features">
        <h2 class="section-title">核心功能</h2>
        <p class="section-subtitle">专业级工具，让投资决策更智慧</p>
        <div class="feature-grid">
          <div v-for="(f, i) in features" :key="i" class="feature-card" :style="{ animationDelay: i * 0.1 + 's' }">
            <div class="feature-icon">{{ f.icon }}</div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </section>

      <!-- 实时行情预览 -->
      <section class="market-preview" id="market">
        <h2 class="section-title">实时行情</h2>
        <p class="section-subtitle">注册登录即可解锁完整功能</p>
        <el-tabs v-model="marketTab" class="dark-tabs">
          <el-tab-pane label="涨幅榜" name="gainers">
            <el-table :data="gainers" size="small" class="dark-table" v-loading="marketLoading" empty-text="暂无数据">
              <el-table-column prop="symbol" label="代码" width="80" />
              <el-table-column prop="name" label="名称" width="100" />
              <el-table-column label="最新价" width="80">
                <template #default="{ row }">{{ row.quote?.price?.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="涨跌幅" width="100">
                <template #default="{ row }">
                  <span :class="row.quote?.changePercent > 0 ? 'text-up' : 'text-down'">
                    {{ row.quote?.changePercent > 0 ? '+' : '' }}{{ row.quote?.changePercent?.toFixed(2) }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="成交额(万)">
                <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="跌幅榜" name="losers">
            <el-table :data="losers" size="small" class="dark-table" v-loading="marketLoading" empty-text="暂无数据">
              <el-table-column prop="symbol" label="代码" width="80" />
              <el-table-column prop="name" label="名称" width="100" />
              <el-table-column label="最新价" width="80">
                <template #default="{ row }">{{ row.quote?.price?.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="涨跌幅" width="100">
                <template #default="{ row }">
                  <span :class="row.quote?.changePercent > 0 ? 'text-up' : 'text-down'">
                    {{ row.quote?.changePercent > 0 ? '+' : '' }}{{ row.quote?.changePercent?.toFixed(2) }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="成交额(万)">
                <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="成交额榜" name="volume">
            <el-table :data="topVolume" size="small" class="dark-table" v-loading="marketLoading" empty-text="暂无数据">
              <el-table-column prop="symbol" label="代码" width="80" />
              <el-table-column prop="name" label="名称" width="100" />
              <el-table-column label="最新价" width="80">
                <template #default="{ row }">{{ row.quote?.price?.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="涨跌幅" width="100">
                <template #default="{ row }">
                  <span :class="row.quote?.changePercent > 0 ? 'text-up' : 'text-down'">
                    {{ row.quote?.changePercent > 0 ? '+' : '' }}{{ row.quote?.changePercent?.toFixed(2) }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="成交额(万)">
                <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
        <div class="market-cta">
          <el-button type="primary" size="large" round @click="$router.push('/market')">查看完整行情 →</el-button>
        </div>
      </section>

      <section class="pricing-section">
        <h2 class="section-title">选择适合你的计划</h2>
        <p class="section-subtitle">从免费体验到企业级服务，按需升级</p>
        <div class="pricing-grid">
          <div class="pricing-card" v-for="plan in plans" :key="plan.slug" :class="{ featured: plan.featured }">
            <div class="plan-badge" v-if="plan.featured">推荐</div>
            <h3>{{ plan.name }}</h3>
            <div class="price">
              <span class="amount">{{ plan.price }}</span>
              <span class="period">{{ plan.price === '免费' ? '' : '/月' }}</span>
            </div>
            <p class="plan-desc">{{ plan.desc }}</p>
            <ul class="plan-features">
              <li v-for="f in plan.features" :key="f" :class="{ disabled: !f.included }">
                <span class="check">{{ f.included ? '✓' : '✗' }}</span> {{ f.name }}
              </li>
            </ul>
            <el-button :type="plan.featured ? 'primary' : 'default'" size="large" round @click="$router.push('/register')" class="plan-btn">
              {{ plan.price === '免费' ? '立即开始' : '立即订阅' }}
            </el-button>
          </div>
        </div>
      </section>

      <footer class="landing-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="brand-icon">📈</span> <span>智慧证券分析平台</span>
          </div>
          <div class="footer-links">
            <span>云南意念科技有限责任公司</span>
          </div>
          <p class="footer-copy">Copyright © 2026 云南意念科技有限责任公司 滇ICP备10000001号-1 | 网站版本 v2026.03.26</p>
        </div>
      </footer>
    </div>

    <!-- 已登录时重定向 -->
    <div v-else class="redirect">
      <div class="redirect-spinner"></div>
      <p>正在跳转到行情中心...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import axios from 'axios'
import { API_BASE } from '../utils/config'

const router = useRouter()
const userStore = useUserStore()

// Market data for landing page
const marketTab = ref('gainers')
const marketLoading = ref(false)
const gainers = ref([])
const losers = ref([])
const topVolume = ref([])

const loadMarketData = async () => {
  marketLoading.value = true
  try {
    const [g, l, v] = await Promise.all([
      axios.get(`${API_BASE}/stocks/rank/gainers?limit=10`),
      axios.get(`${API_BASE}/stocks/rank/losers?limit=10`),
      axios.get(`${API_BASE}/stocks/rank/volume?limit=10`)
    ])
    gainers.value = g.data.data?.stocks || []
    losers.value = l.data.data?.stocks || []
    topVolume.value = v.data.data?.stocks || []
  } catch (e) { /* market data load failed, show empty */ }
  finally { marketLoading.value = false }
}

const features = [
  { icon: '📊', title: '专业行情', desc: '实时K线、分时图、五档盘口，涵盖A股、港股、美股全市场' },
  { icon: '🤖', title: 'AI智能分析', desc: '基于大模型的深度技术分析、基本面评估和操作建议' },
  { icon: '⭐', title: '自选股管理', desc: '灵活分组、标签管理、目标价和止损位一键设置' },
  { icon: '🔔', title: '智能预警', desc: '价格突破、涨跌幅、成交量等多维度实时推送' },
  { icon: '🔑', title: 'API & 计费', desc: 'OpenAI兼容API，精确Token计费，按量灵活付费' },
  { icon: '💎', title: '分层订阅', desc: 'Free/Starter/Pro/Enterprise四层体系，按需选择' }
]

const plans = ref([
  { slug: 'free', name: 'Free', price: '免费', featured: false, desc: '基础行情浏览', features: [
    { name: '基础行情', included: true }, { name: '20只自选股', included: true }, { name: '5个预警', included: true },
    { name: '每日3次AI分析', included: true }, { name: '延时行情', included: true }, { name: '实时行情', included: false }
  ]},
  { slug: 'starter', name: 'Starter', price: '¥49', featured: true, desc: '个人投资者日常使用', features: [
    { name: '实时行情', included: true }, { name: '50只自选股', included: true }, { name: '20个预警', included: true },
    { name: '每日20次AI分析', included: true }, { name: '全周期K线', included: true }, { name: '技术指标', included: true }
  ]},
  { slug: 'pro', name: 'Pro', price: '¥199', featured: false, desc: '专业投资者', features: [
    { name: '无限AI分析', included: true }, { name: '200只自选股', included: true }, { name: 'API访问', included: true },
    { name: '组合分析', included: true }, { name: '数据导出', included: true }, { name: '自定义指标', included: true }
  ]},
  { slug: 'enterprise', name: 'Enterprise', price: '¥999', featured: false, desc: '机构投资者', features: [
    { name: '全部功能', included: true }, { name: '无限自选 & 预警', included: true }, { name: '无限制API', included: true },
    { name: '私有化部署', included: true }, { name: 'SLA 99.9%', included: true }, { name: '专属客户经理', included: true }
  ]}
])

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  loadMarketData()
  if (userStore.isAuthenticated) router.push('/dashboard')
})
</script>

<style scoped>
.home { background: #0f0f23; min-height: 100vh; }

/* 顶部导航 */
.landing-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 40px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(15,15,35,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(45,45,68,0.5); }
.brand { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.brand-icon { font-size: 26px; }
.brand-text { background: linear-gradient(135deg, #e94560, #ff6b6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.header-actions { display: flex; gap: 12px; }

/* Hero 区域 */
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 120px 20px 80px; position: relative; overflow: hidden; }
.hero-bg-effects { position: absolute; inset: 0; pointer-events: none; }
.bg-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; }
.orb-1 { width: 500px; height: 500px; background: rgba(233,69,96,0.15); top: -100px; left: -100px; animation: float 12s ease-in-out infinite; }
.orb-2 { width: 400px; height: 400px; background: rgba(99,179,237,0.1); bottom: -80px; right: -80px; animation: float 15s ease-in-out infinite reverse; }
.orb-3 { width: 300px; height: 300px; background: rgba(246,173,85,0.1); top: 40%; left: 60%; animation: float 10s ease-in-out infinite 3s; }
@keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -30px); } }

.hero-content { max-width: 820px; position: relative; z-index: 1; }
.hero-badge { display: inline-block; padding: 6px 18px; background: rgba(233,69,96,0.15); border: 1px solid rgba(233,69,96,0.3); border-radius: 20px; font-size: 13px; color: #e94560; margin-bottom: 28px; font-weight: 500; }
.hero h1 { font-size: 56px; font-weight: 800; line-height: 1.2; margin-bottom: 24px; color: #f7fafc; }
.hero .line1 { display: block; font-size: 28px; font-weight: 500; color: #a0aec0; margin-bottom: 8px; }
.gradient-text { background: linear-gradient(135deg, #e94560, #ff6b6b, #ffa07a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: block; font-size: 56px; }
.subtitle { font-size: 18px; color: #718096; line-height: 1.7; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; }
.hero-actions { display: flex; gap: 16px; justify-content: center; margin-bottom: 60px; }
.btn-arrow { margin-left: 6px; transition: transform 0.2s; }
.hero-actions .el-button:hover .btn-arrow { transform: translateX(4px); }

.stats-bar { display: flex; justify-content: center; align-items: center; gap: 40px; }
.stat-divider { width: 1px; height: 36px; background: #2d2d44; }
.stat-item { text-align: center; }
.stat-num { display: block; font-size: 28px; font-weight: 700; color: #f7fafc; }
.stat-label { font-size: 13px; color: #4a5568; margin-top: 4px; }

/* 功能区域 */
.features { padding: 100px 20px; max-width: 1200px; margin: 0 auto; }
.section-title { text-align: center; font-size: 36px; font-weight: 700; margin-bottom: 12px; color: #f7fafc; }
.section-subtitle { text-align: center; font-size: 16px; color: #718096; margin-bottom: 50px; }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.feature-card { background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 16px; padding: 36px 28px; text-align: center; transition: all 0.35s ease; }
.feature-card:hover { transform: translateY(-6px); border-color: #e94560; box-shadow: 0 12px 40px rgba(233,69,96,0.12); }
.feature-icon { font-size: 44px; margin-bottom: 18px; }
.feature-card h3 { font-size: 18px; margin-bottom: 10px; color: #f7fafc; font-weight: 600; }
.feature-card p { color: #718096; font-size: 14px; line-height: 1.7; }

/* 行情预览 */
.market-preview { padding: 80px 20px; max-width: 1000px; margin: 0 auto; }
.market-preview .dark-tabs { margin-top: 30px; }
.market-preview :deep(.el-tabs__nav-wrap::after) { background: #2d2d44; }
.market-preview :deep(.el-tabs__item) { color: #718096; font-size: 15px; }
.market-preview :deep(.el-tabs__item.is-active) { color: #e94560; }
.dark-table { background: transparent; }
.dark-table :deep(.el-table__header th) { background: #16213e !important; color: #a0aec0; border-bottom: 1px solid #2d2d44; }
.dark-table :deep(.el-table__row) { background: transparent; }
.dark-table :deep(.el-table__row:hover > td) { background: rgba(233,69,96,0.06) !important; }
.dark-table :deep(.el-table__body td) { border-bottom: 1px solid rgba(45,45,68,0.4); color: #e2e8f0; }
.dark-table :deep(.el-table__empty-text) { color: #4a5568; }
.text-up { color: #ef4444; font-weight: 600; }
.text-down { color: #22c55e; font-weight: 600; }
.market-cta { text-align: center; margin-top: 30px; }

/* 定价区域 */
.pricing-section { padding: 100px 20px; max-width: 1200px; margin: 0 auto; }
.pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.pricing-card { background: #1a1a2e; border: 2px solid #2d2d44; border-radius: 16px; padding: 32px 24px; position: relative; transition: all 0.35s ease; }
.pricing-card:hover { transform: translateY(-4px); }
.pricing-card.featured { border-color: #e94560; transform: scale(1.04); box-shadow: 0 12px 48px rgba(233,69,96,0.2); }
.pricing-card.featured:hover { transform: scale(1.06); }
.plan-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #e94560, #ff6b6b); color: white; padding: 4px 22px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.pricing-card h3 { font-size: 20px; margin: 12px 0; color: #f7fafc; font-weight: 600; }
.price { margin: 16px 0; }
.amount { font-size: 40px; font-weight: 800; color: #e94560; }
.period { font-size: 14px; color: #4a5568; }
.plan-desc { color: #718096; font-size: 13px; margin-bottom: 20px; }
.plan-features { list-style: none; padding: 0; margin-bottom: 28px; }
.plan-features li { padding: 9px 0; font-size: 13px; color: #a0aec0; border-bottom: 1px solid rgba(45,45,68,0.5); display: flex; align-items: center; gap: 8px; }
.plan-features li:last-child { border-bottom: none; }
.plan-features li.disabled { color: #4a5568; }
.plan-features .check { font-size: 12px; }
.plan-btn { width: 100%; }

/* 底部 */
.landing-footer { border-top: 1px solid #2d2d44; padding: 40px 20px; text-align: center; }
.footer-content { max-width: 1200px; margin: 0 auto; }
.footer-brand { font-size: 16px; color: #a0aec0; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; }
.footer-links { color: #4a5568; font-size: 13px; margin-bottom: 8px; }
.footer-links a { color: #e94560; text-decoration: none; }
.footer-links a:hover { text-decoration: underline; }
.footer-dot { margin: 0 8px; }
.footer-copy { font-size: 12px; color: #2d2d44; }

/* 重定向 */
.redirect { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: #718096; font-size: 16px; gap: 16px; }
.redirect-spinner { width: 32px; height: 32px; border: 3px solid #2d2d44; border-top-color: #e94560; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 响应式 */
@media (max-width: 1024px) {
  .feature-grid { grid-template-columns: repeat(2, 1fr); }
  .pricing-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .landing-header { padding: 12px 20px; }
  .hero h1 { font-size: 36px; }
  .hero .line1 { font-size: 20px; }
  .gradient-text { font-size: 36px; }
  .subtitle { font-size: 15px; }
  .stats-bar { gap: 20px; }
  .stat-num { font-size: 22px; }
  .feature-grid { grid-template-columns: 1fr; }
  .pricing-grid { grid-template-columns: 1fr; }
  .pricing-card.featured { transform: none; }
  .hero-actions { flex-direction: column; align-items: center; }
}
</style>
