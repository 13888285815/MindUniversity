<template>
  <div class="billing-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <!-- Token 余额 -->
        <el-card>
          <h3 style="color:#f7fafc;margin-bottom:16px;">💰 Token 余额</h3>
          <div class="balance-display">
            <span class="bal-val">{{ balance.toLocaleString() }}</span>
            <span class="bal-label">可用Token</span>
          </div>
          <div style="margin-top:16px;">
            <div class="stat-row"><span>本月已用</span><span>{{ monthlyUsed.toLocaleString() }}</span></div>
            <div class="stat-row"><span>累计使用</span><span>{{ totalUsed.toLocaleString() }}</span></div>
          </div>
          <el-button type="primary" style="width:100%;margin-top:16px;" @click="showRechargeDialog = true">充值 Token</el-button>
        </el-card>

        <!-- API Keys 管理 -->
        <el-card style="margin-top:16px;">
          <h3 style="color:#f7fafc;margin-bottom:16px;">🔑 API Keys</h3>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="color:#a0aec0;font-size:13px;">用于程序化访问接口</span>
            <el-button type="primary" size="small" @click="createKey">创建</el-button>
          </div>
          <div v-for="key in keys" :key="key.keyId" class="key-item">
            <div class="key-info">
              <span class="key-name">{{ key.name }}</span>
              <span class="key-prefix">{{ key.keyPrefix }}...</span>
            </div>
            <span class="key-time">{{ key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : '未使用' }}</span>
            <el-button size="small" type="danger" link @click="deleteKey(key.keyId)">删除</el-button>
          </div>
          <el-empty v-if="keys.length === 0" description="暂无API Key" :image-size="60" />
          <div v-if="newKey" class="new-key-warning">
            <div class="warning-text">⚠️ 请立即保存此Key，关闭后将无法再次查看</div>
            <code>{{ newKey }}</code>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <!-- Token 使用统计 -->
        <el-card>
          <h3 style="color:#f7fafc;margin-bottom:16px;">📊 使用统计</h3>
          <div ref="usageChartRef" style="height:280px;"></div>
        </el-card>

        <!-- 账单记录 -->
        <el-card style="margin-top:16px;">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <h3 style="color:#f7fafc;margin:0;">🧾 账单记录</h3>
              <el-button size="small" @click="generateInvoice">生成月度账单</el-button>
            </div>
          </template>
          <el-table :data="invoices" size="small" class="dark-table" empty-text="暂无账单记录">
            <el-table-column prop="period" label="账单周期" width="120" />
            <el-table-column label="Token使用" width="120">
              <template #default="{ row }">{{ row.tokensUsed?.toLocaleString() || 0 }}</template>
            </el-table-column>
            <el-table-column label="金额">
              <template #default="{ row }">¥{{ (row.amount || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'paid' ? 'success' : row.status === 'pending' ? 'warning' : 'info'" size="small">
                  {{ { paid: '已付', pending: '待付', cancelled: '已取消' }[row.status] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间">
              <template #default="{ row }">{{ row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 充值弹窗 -->
    <el-dialog v-model="showRechargeDialog" title="充值 Token" width="400px">
      <el-form label-width="80px">
        <el-form-item label="充值数量">
          <el-radio-group v-model="rechargeAmount" style="display:flex;flex-direction:column;gap:12px;">
            <el-radio :value="10000">10,000 Tokens — ¥10</el-radio>
            <el-radio :value="50000">50,000 Tokens — ¥45</el-radio>
            <el-radio :value="100000">100,000 Tokens — ¥80</el-radio>
            <el-radio :value="500000">500,000 Tokens — ¥350</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRechargeDialog = false">取消</el-button>
        <el-button type="primary" @click="recharge">立即充值</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

import { API_BASE as API } from '../utils/config'
const userStore = useUserStore()
const balance = ref(0)
const monthlyUsed = ref(0)
const totalUsed = ref(0)
const keys = ref([])
const newKey = ref(null)
const invoices = ref([])
const showRechargeDialog = ref(false)
const rechargeAmount = ref(50000)
const usageChartRef = ref(null)

const authHeaders = { headers: { Authorization: `Bearer ${userStore.token}` } }

const load = async () => {
  try {
    const [b, k] = await Promise.all([
      axios.get(`${API}/billing/balance`, authHeaders),
      axios.get(`${API}/auth/keys`, authHeaders)
    ])
    balance.value = b.data.data.balance || 0
    monthlyUsed.value = b.data.data.monthlyUsed || 0
    totalUsed.value = b.data.data.totalUsed || 0
    keys.value = k.data.data.keys || []
  } catch (e) { console.error('加载计费数据失败:', e) }
}

const loadInvoices = async () => {
  try {
    const res = await axios.get(`${API}/billing/invoices?limit=10`, authHeaders)
    invoices.value = res.data.data?.invoices || res.data.data || []
  } catch (e) {}
}

const loadUsageChart = async () => {
  try {
    const res = await axios.get(`${API}/billing/usage/daily?days=30`, authHeaders)
    const daily = res.data.data?.daily || []
    if (daily.length === 0 || !usageChartRef.value) return
    const chart = echarts.init(usageChartRef.value, 'dark')
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: daily.map(d => d.date?.slice(5) || ''), axisLabel: { fontSize: 10, color: '#718096' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#2d2d44' } }, axisLabel: { color: '#718096' } },
      series: [{
        name: 'Token使用量',
        type: 'bar',
        data: daily.map(d => d.tokensUsed || d.count || 0),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#e94560' }, { offset: 1, color: 'rgba(233,69,96,0.2)' }]) },
        barMaxWidth: 20
      }]
    })
  } catch (e) {}
}

const createKey = async () => {
  try {
    const res = await axios.post(`${API}/auth/keys`, { name: `Key-${Date.now().toString(36).toUpperCase()}` }, authHeaders)
    newKey.value = res.data.data.apiKey
    load()
  } catch (e) { ElMessage.error(e.response?.data?.message) }
}

const deleteKey = async (id) => {
  try {
    await axios.delete(`${API}/auth/keys/${id}`, authHeaders)
    load()
  } catch (e) {}
}

const generateInvoice = async () => {
  try {
    const res = await axios.post(`${API}/billing/invoices/generate`, {}, authHeaders)
    ElMessage.success('账单生成成功')
    loadInvoices()
  } catch (e) { ElMessage.error(e.response?.data?.message || '生成失败') }
}

const recharge = async () => {
  try {
    // Call Stripe checkout or similar payment flow
    ElMessage.info('支付功能即将上线，敬请期待')
    showRechargeDialog.value = false
  } catch (e) { ElMessage.error('充值失败') }
}

onMounted(async () => {
  await load()
  await loadInvoices()
  await nextTick()
  loadUsageChart()
})
</script>

<style scoped>
.balance-display { text-align: center; padding: 24px; background: linear-gradient(135deg, #16213e, #1a1a3e); border-radius: 12px; }
.bal-val { display: block; font-size: 42px; font-weight: 800; color: #f6ad55; }
.bal-label { color: #718096; font-size: 14px; }
.stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2d2d44; font-size: 14px; color: #a0aec0; }
.key-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #2d2d44; font-size: 13px; gap: 8px; }
.key-info { flex: 1; display: flex; flex-direction: column; }
.key-name { color: #e2e8f0; font-weight: 500; }
.key-prefix { color: #718096; font-size: 12px; font-family: monospace; }
.key-time { color: #4a5568; font-size: 12px; }
.new-key-warning { margin-top: 12px; padding: 12px; background: #16213e; border-radius: 8px; border: 1px solid rgba(255,165,2,0.3); }
.warning-text { color: #ffa502; font-size: 12px; margin-bottom: 6px; }
.new-key-warning code { color: #2ed573; word-break: break-all; font-size: 12px; }
:deep(.dark-table) { --el-table-bg-color: transparent; --el-table-tr-bg-color: transparent; --el-table-header-bg-color: #16213e; --el-table-row-hover-bg-color: #1f2b47; --el-table-text-color: #e2e8f0; --el-table-header-text-color: #a0aec0; --el-table-border-color: #2d2d44; }
</style>
