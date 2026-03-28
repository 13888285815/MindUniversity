<template>
  <div class="dashboard">
    <!-- 大盘指数 -->
    <div class="indices-bar">
      <div v-for="idx in indices" :key="idx.symbol" class="index-card" :class="{ up: idx.changePercent > 0, down: idx.changePercent < 0 }">
        <div class="idx-name">{{ idx.name }}</div>
        <div class="idx-price">{{ idx.price?.toFixed(2) }}</div>
        <div class="idx-change">{{ idx.changePercent > 0 ? '+' : '' }}{{ idx.changePercent?.toFixed(2) }}%</div>
      </div>
    </div>

    <!-- 涨跌统计 -->
    <el-row :gutter="20" class="market-stats">
      <el-col :span="4"><div class="stat-box limit-up">涨停 {{ stats.limitUp || 0 }}</div></el-col>
      <el-col :span="4"><div class="stat-box up">上涨 {{ stats.upCount || 0 }}</div></el-col>
      <el-col :span="4"><div class="stat-box flat">平盘 {{ stats.flatCount || 0 }}</div></el-col>
      <el-col :span="4"><div class="stat-box down">下跌 {{ stats.downCount || 0 }}</div></el-col>
      <el-col :span="4"><div class="stat-box limit-down">跌停 {{ stats.limitDown || 0 }}</div></el-col>
      <el-col :span="4"><div class="stat-box total">总计 {{ stats.total || 0 }}</div></el-col>
    </el-row>

    <!-- 行情数据 -->
    <el-row :gutter="20">
      <!-- 涨幅榜 -->
      <el-col :span="12">
        <el-card class="rank-card">
          <template #header><span class="card-title up">📈 涨幅榜</span></template>
          <el-table :data="gainers" size="small" :show-header="true" class="dark-table" :row-class-name="tableRowClass" v-loading="loading" empty-text="数据加载中，请稍候...">
            <el-table-column prop="symbol" label="代码" width="80" />
            <el-table-column prop="name" label="名称" width="100" />
            <el-table-column prop="quote.price" label="最新价" width="80">
              <template #default="{ row }">{{ row.quote?.price?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="quote.changePercent" label="涨跌幅" width="90">
              <template #default="{ row }">
                <span :class="row.quote?.changePercent > 0 ? 'text-up' : 'text-down'">
                  {{ row.quote?.changePercent > 0 ? '+' : '' }}{{ row.quote?.changePercent?.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="quote.amount" label="成交额(万)">
              <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 跌幅榜 -->
      <el-col :span="12">
        <el-card class="rank-card">
          <template #header><span class="card-title down">📉 跌幅榜</span></template>
          <el-table :data="losers" size="small" class="dark-table" :row-class-name="tableRowClass" v-loading="loading" empty-text="数据加载中，请稍候...">
            <el-table-column prop="symbol" label="代码" width="80" />
            <el-table-column prop="name" label="名称" width="100" />
            <el-table-column prop="quote.price" label="最新价" width="80">
              <template #default="{ row }">{{ row.quote?.price?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="quote.changePercent" label="涨跌幅" width="90">
              <template #default="{ row }">
                <span :class="row.quote?.changePercent > 0 ? 'text-up' : 'text-down'">
                  {{ row.quote?.changePercent > 0 ? '+' : '' }}{{ row.quote?.changePercent?.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="quote.amount" label="成交额(万)">
              <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 板块行情 & 成交额排行 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header><span class="card-title">🏢 板块行情</span></template>
          <div class="sector-grid">
            <div v-for="s in sectors" :key="s.name" class="sector-item" :class="{ up: s.change > 0, down: s.change < 0 }">
              <span class="sector-name">{{ s.name }}</span>
              <span class="sector-change">{{ s.change > 0 ? '+' : '' }}{{ s.change.toFixed(2) }}%</span>
              <span class="sector-vol">{{ s.volume }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span class="card-title">💰 成交额排行</span></template>
          <el-table :data="topVolume" size="small" class="dark-table" v-loading="loading" empty-text="数据加载中，请稍候...">
            <el-table-column type="index" width="40" />
            <el-table-column prop="symbol" label="代码" width="80" />
            <el-table-column prop="name" label="名称" width="100" />
            <el-table-column prop="quote.amount" label="成交额(万)">
              <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) }}</template>
            </el-table-column>
            <el-table-column prop="quote.changePercent" label="涨跌幅">
              <template #default="{ row }">
                <span :class="row.quote?.changePercent > 0 ? 'text-up' : 'text-down'">
                  {{ row.quote?.changePercent > 0 ? '+' : '' }}{{ row.quote?.changePercent?.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

import { API_BASE as API } from '../utils/config'

const loading = ref(true)

const indices = ref([
  { symbol: '000001', market: 'SH', name: '上证指数', price: 3285.67, changePercent: 0.85 },
  { symbol: '399001', market: 'SZ', name: '深证成指', price: 10567.23, changePercent: 1.12 },
  { symbol: '399006', market: 'SZ', name: '创业板指', price: 2178.45, changePercent: 1.56 },
  { symbol: '000300', market: 'SH', name: '沪深300', price: 3876.90, changePercent: 0.67 },
  { symbol: '000688', market: 'SH', name: '科创50', price: 978.34, changePercent: -0.35 }
])

const stats = ref({ limitUp: 12, limitDown: 3, upCount: 2456, downCount: 1890, flatCount: 234, total: 4580 })
const gainers = ref([])
const losers = ref([])
const topVolume = ref([])
const sectors = ref([
  { name: '科技', change: 2.35, volume: '156亿' }, { name: '医药', change: -0.82, volume: '98亿' },
  { name: '新能源', change: 1.56, volume: '203亿' }, { name: '消费', change: -0.35, volume: '87亿' },
  { name: '金融', change: 0.78, volume: '134亿' }, { name: '半导体', change: 3.12, volume: '112亿' },
  { name: '军工', change: 1.05, volume: '76亿' }, { name: '地产', change: -1.25, volume: '65亿' }
])

const tableRowClass = ({ row }) => (row.quote?.changePercent > 0 ? 'row-up' : row.quote?.changePercent < 0 ? 'row-down' : '')

onMounted(async () => {
  try {
    // Try to load real market indices
    const idxRes = await axios.get(`${API}/market/indices`)
    if (idxRes.data.data?.indices) indices.value = idxRes.data.data.indices
  } catch (e) { /* use fallback data */ }

  try {
    const s = await axios.get(`${API}/market/stats`)
    stats.value = s.data.data
  } catch (e) { /* use fallback data */ }

  try {
    const secRes = await axios.get(`${API}/market/sectors`)
    if (secRes.data.data?.sectors) sectors.value = secRes.data.data.sectors
  } catch (e) { /* use fallback data */ }

  try {
    const [g, l, v] = await Promise.all([
      axios.get(`${API}/stocks/rank/gainers?limit=15`),
      axios.get(`${API}/stocks/rank/losers?limit=15`),
      axios.get(`${API}/stocks/rank/volume?limit=15`)
    ])
    gainers.value = g.data.data.stocks || []
    losers.value = l.data.data.stocks || []
    topVolume.value = v.data.data.stocks || []
  } catch (e) {
    ElMessage.warning('排行榜数据加载失败，当前为示例数据')
  } finally { loading.value = false }
})
</script>

<style scoped>
.indices-bar { display: flex; gap: 12px; margin-bottom: 20px; overflow-x: auto; }
.index-card { flex: 1; min-width: 180px; background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 10px; padding: 14px 16px; text-align: center; }
.idx-name { font-size: 12px; color: #718096; margin-bottom: 6px; }
.idx-price { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.idx-change { font-size: 14px; font-weight: 600; }
.index-card.up .idx-price, .index-card.up .idx-change { color: #ff4757; }
.index-card.down .idx-price, .index-card.down .idx-change { color: #2ed573; }
.market-stats { margin-bottom: 20px; }
.stat-box { text-align: center; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 14px; }
.stat-box.limit-up { background: rgba(255, 71, 87, 0.15); color: #ff4757; border: 1px solid rgba(255, 71, 87, 0.3); }
.stat-box.up { background: rgba(255, 71, 87, 0.08); color: #ff6b6b; border: 1px solid rgba(255, 71, 87, 0.2); }
.stat-box.flat { background: rgba(160, 174, 192, 0.08); color: #a0aec0; border: 1px solid rgba(160, 174, 192, 0.2); }
.stat-box.down { background: rgba(46, 213, 115, 0.08); color: #2ed573; border: 1px solid rgba(46, 213, 115, 0.2); }
.stat-box.limit-down { background: rgba(46, 213, 115, 0.15); color: #2ed573; border: 1px solid rgba(46, 213, 115, 0.3); }
.stat-box.total { background: rgba(99, 179, 237, 0.08); color: #63b3ed; border: 1px solid rgba(99, 179, 237, 0.2); }
.card-title { font-weight: 600; font-size: 16px; }
.card-title.up { color: #ff4757; }
.card-title.down { color: #2ed573; }
.sector-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.sector-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 8px; background: #16213e; }
.sector-name { font-weight: 500; font-size: 14px; }
.sector-change { font-weight: 600; font-size: 14px; }
.sector-vol { font-size: 12px; color: #718096; }
.sector-item.up .sector-change { color: #ff4757; }
.sector-item.down .sector-change { color: #2ed573; }
.text-up { color: #ff4757 !important; font-weight: 600; }
.text-down { color: #2ed573 !important; font-weight: 600; }
:deep(.dark-table) { --el-table-bg-color: transparent; --el-table-tr-bg-color: transparent; --el-table-header-bg-color: #16213e; --el-table-row-hover-bg-color: #1f2b47; --el-table-text-color: #e2e8f0; --el-table-header-text-color: #a0aec0; --el-table-border-color: #2d2d44; }
:deep(.row-up) { color: #ff4757; }
:deep(.row-down) { color: #2ed573; }
</style>
