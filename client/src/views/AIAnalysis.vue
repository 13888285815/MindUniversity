<template>
  <div class="ai-page">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-card>
          <template #header><span style="font-weight:600;">🤖 AI 智能分析</span></template>
          <el-form label-position="top">
            <el-form-item label="股票代码">
              <el-input v-model="symbol" placeholder="如: 600519" />
            </el-form-item>
            <el-form-item label="市场">
              <el-select v-model="market" style="width:100%">
                <el-option label="上海 (SH)" value="SH" /><el-option label="深圳 (SZ)" value="SZ" />
                <el-option label="香港 (HK)" value="HK" /><el-option label="美国 (US)" value="US" />
              </el-select>
            </el-form-item>
            <el-form-item label="分析类型">
              <el-radio-group v-model="type">
                <el-radio-button value="comprehensive">综合分析</el-radio-button>
                <el-radio-button value="technical">技术分析</el-radio-button>
                <el-radio-button value="fundamental">基本面</el-radio-button>
                <el-radio-button value="risk">风险评估</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-button type="primary" size="large" round style="width:100%;" :loading="loading" @click="analyze" :disabled="remaining <= 0">
              开始分析 (今日剩余: {{ remaining }} 次)
            </el-button>
          </el-form>
        </el-card>

        <!-- 分析历史 -->
        <el-card style="margin-top:16px;">
          <template #header><span style="font-weight:600;">📊 分析历史</span></template>
          <div v-for="item in history" :key="item._id" class="history-item" @click="viewAnalysis(item)">
            <div class="hist-header">
              <span class="hist-title">{{ item.title }}</span>
              <span class="hist-signal" :class="item.signal">{{ signalLabels[item.signal] }}</span>
            </div>
            <div class="hist-meta">{{ new Date(item.createdAt).toLocaleString() }} | Token: {{ item.tokensUsed?.total }}</div>
          </div>
          <el-empty v-if="history.length === 0" description="暂无分析记录" />
        </el-card>
      </el-col>

      <el-col :span="14">
        <div v-if="result" class="result-panel">
          <el-card>
            <template #header>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;">{{ result.title }}</span>
                <span class="signal-badge" :class="result.signal">{{ signalLabels[result.signal] }}</span>
              </div>
            </template>
            <!-- 评分 -->
            <div class="score-grid">
              <div v-for="(val, key) in result.score" :key="key" class="score-card" :class="getScoreClass(val)">
                <span class="score-label">{{ scoreLabels[key] }}</span>
                <span class="score-val">{{ val }}</span>
              </div>
            </div>
            <!-- 摘要 -->
            <div class="analysis-section">
              <h4>📋 分析摘要</h4>
              <p>{{ result.summary }}</p>
            </div>
            <!-- 目标价 -->
            <div class="price-targets">
              <div class="target-box up"><span>目标价</span><strong>{{ result.targetPrice }}</strong></div>
              <div class="target-box down"><span>止损价</span><strong>{{ result.stopLoss }}</strong></div>
            </div>
            <!-- 详细分析 -->
            <div class="analysis-section" v-if="result.analysis">
              <h4>📊 技术分析</h4><p>{{ result.analysis.technical }}</p>
              <h4>💼 基本面分析</h4><p>{{ result.analysis.fundamental }}</p>
              <h4>⚠️ 风险评估</h4><p>{{ result.analysis.riskAssessment }}</p>
              <h4>💡 操作建议</h4><p>{{ result.analysis.recommendation }}</p>
            </div>
            <!-- 关键指标 -->
            <div class="analysis-section" v-if="result.keyIndicators?.length">
              <h4>🔑 关键指标</h4>
              <el-table :data="result.keyIndicators" size="small" class="dark-table">
                <el-table-column prop="name" label="指标" />
                <el-table-column prop="value" label="数值" />
                <el-table-column prop="signal" label="信号">
                  <template #default="{ row }"><span :class="row.signal === '看多' || row.signal === '优秀' || row.signal === '低估' ? 'text-up' : 'text-down'">{{ row.signal }}</span></template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="选择股票并开始AI分析" style="margin-top:100px;" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

import { API_BASE as API } from '../utils/config'
const userStore = useUserStore()
const symbol = ref('600519')
const market = ref('SH')
const type = ref('comprehensive')
const loading = ref(false)
const result = ref(null)
const history = ref([])
const remaining = ref(0)

const signalLabels = { strong_buy: '强烈买入', buy: '买入', neutral: '中性', sell: '卖出', strong_sell: '强烈卖出' }
const scoreLabels = { overall: '综合评分', technical: '技术面', fundamental: '基本面', risk: '风险', sentiment: '情绪' }
const getScoreClass = (v) => v >= 70 ? 'high' : v >= 40 ? 'mid' : 'low'

// Load remaining quota from user subscription
const loadQuota = () => {
  const plan = userStore.user?.subscription?.plan
  const quotas = { free: 3, starter: 20, pro: Infinity, enterprise: Infinity }
  // Default to free if no plan info
  remaining.value = quotas[plan] ?? 3
}

const analyze = async () => {
  loading.value = true
  try {
    const res = await axios.post(`${API}/ai/analyze`, { symbol: symbol.value, market: market.value, type: type.value }, { headers: { Authorization: `Bearer ${userStore.token}` } })
    result.value = res.data.data
    remaining.value--
    loadHistory()
  } catch (e) { ElMessage.error(e.response?.data?.message || '分析失败') }
  finally { loading.value = false }
}

const loadHistory = async () => {
  try {
    const res = await axios.get(`${API}/ai/history?limit=10`, { headers: { Authorization: `Bearer ${userStore.token}` } })
    history.value = res.data.data.analyses || []
  } catch (e) {}
}

const viewAnalysis = (item) => { result.value = item }
onMounted(() => {
  loadQuota()
  loadHistory()
})
</script>

<style scoped>
.score-grid { display: flex; gap: 12px; margin-bottom: 20px; }
.score-card { flex: 1; text-align: center; padding: 16px; border-radius: 10px; }
.score-card.high { background: rgba(46,213,115,0.15); border: 1px solid rgba(46,213,115,0.3); }
.score-card.mid { background: rgba(255,165,2,0.15); border: 1px solid rgba(255,165,2,0.3); }
.score-card.low { background: rgba(255,71,87,0.15); border: 1px solid rgba(255,71,87,0.3); }
.score-label { display: block; font-size: 12px; color: #718096; margin-bottom: 6px; }
.score-val { display: block; font-size: 28px; font-weight: 800; }
.score-card.high .score-val { color: #2ed573; }
.score-card.mid .score-val { color: #ffa502; }
.score-card.low .score-val { color: #ff4757; }
.signal-badge { padding: 4px 14px; border-radius: 14px; font-size: 13px; font-weight: 700; }
.signal-badge.strong_buy, .signal-badge.buy { background: rgba(255,71,87,0.2); color: #ff4757; }
.signal-badge.neutral { background: rgba(255,165,2,0.2); color: #ffa502; }
.signal-badge.sell, .signal-badge.strong_sell { background: rgba(46,213,115,0.2); color: #2ed573; }
.analysis-section { margin: 16px 0; }
.analysis-section h4 { color: #f7fafc; margin-bottom: 8px; font-size: 15px; }
.analysis-section p { color: #a0aec0; font-size: 13px; line-height: 1.7; padding: 10px; background: #16213e; border-radius: 8px; }
.price-targets { display: flex; gap: 16px; margin: 16px 0; }
.target-box { flex: 1; text-align: center; padding: 16px; border-radius: 10px; }
.target-box.up { background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.3); }
.target-box.down { background: rgba(46,213,115,0.1); border: 1px solid rgba(46,213,115,0.3); }
.target-box span { display: block; font-size: 12px; color: #718096; margin-bottom: 6px; }
.target-box strong { font-size: 22px; }
.target-box.up strong { color: #ff4757; }
.target-box.down strong { color: #2ed573; }
.history-item { padding: 12px; border-bottom: 1px solid #2d2d44; cursor: pointer; }
.history-item:hover { background: #1f2b47; }
.hist-header { display: flex; justify-content: space-between; align-items: center; }
.hist-title { font-size: 14px; color: #e2e8f0; }
.hist-signal { font-size: 12px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
.hist-signal.strong_buy, .hist-signal.buy { background: rgba(255,71,87,0.2); color: #ff4757; }
.hist-signal.neutral { background: rgba(255,165,2,0.2); color: #ffa502; }
.hist-signal.sell, .hist-signal.strong_sell { background: rgba(46,213,115,0.2); color: #2ed573; }
.hist-meta { font-size: 12px; color: #4a5568; margin-top: 4px; }
.text-up { color: #ff4757 !important; }
.text-down { color: #2ed573 !important; }
:deep(.dark-table) { --el-table-bg-color: transparent; --el-table-tr-bg-color: transparent; --el-table-header-bg-color: #16213e; --el-table-row-hover-bg-color: #1f2b47; --el-table-text-color: #e2e8f0; --el-table-header-text-color: #a0aec0; --el-table-border-color: #2d2d44; }
</style>
