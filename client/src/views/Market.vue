<template>
  <div class="market-page">
    <!-- Header -->
    <header class="market-header">
      <div class="header-left">
        <div class="brand" @click="$router.push('/')">
          <span class="brand-icon">📈</span>
          <span class="brand-text">智慧证券</span>
        </div>
      </div>
      <div class="header-center">
        <el-input
          v-model="searchInput"
          placeholder="输入股票代码或名称搜索"
          size="large"
          clearable
          style="width: 360px;"
          @keyup.enter="doSearch"
        >
          <template #append><el-button @click="doSearch" :icon="Search">搜索</el-button></template>
        </el-input>
        <div v-if="searchResults.length > 0" class="search-dropdown">
          <div v-for="item in searchResults" :key="item.symbol" class="search-item" @click="selectStock(item)">
            <span class="search-symbol">{{ item.symbol }}</span>
            <span class="search-name">{{ item.name }}</span>
            <span class="search-market">{{ item.market }}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="$router.push('/login')" round>登录</el-button>
        <el-button type="primary" @click="$router.push('/register')" round>免费注册</el-button>
      </div>
    </header>

    <!-- Market Indices Bar -->
    <div class="indices-bar" v-loading="indicesLoading">
      <div v-for="idx in indices" :key="idx.name" class="index-item">
        <span class="index-name">{{ idx.name }}</span>
        <span class="index-price" :class="idx.changePercent > 0 ? 'text-up' : 'text-down'">{{ idx.price?.toFixed(2) }}</span>
        <span class="index-change" :class="idx.changePercent > 0 ? 'text-up' : 'text-down'">
          {{ idx.changePercent > 0 ? '+' : '' }}{{ idx.changePercent?.toFixed(2) }}%
        </span>
      </div>
      <div v-if="indices.length === 0 && !indicesLoading" class="index-item placeholder">
        <span class="index-name">上证指数</span>
        <span class="index-price">3,245.68</span>
        <span class="index-change text-up">+0.52%</span>
      </div>
    </div>

    <!-- Stock Detail Panel (shown after search) -->
    <div v-if="selectedStock" class="stock-detail">
      <el-card class="detail-card">
        <div class="detail-header">
          <div class="stock-info">
            <h2>{{ selectedStock.name }} <span class="symbol-tag">{{ selectedStock.symbol }}</span></h2>
            <div class="quote-row" v-if="selectedStock.quote">
              <span class="current-price" :class="selectedStock.quote.changePercent > 0 ? 'up' : 'down'">
                {{ selectedStock.quote.price?.toFixed(2) }}
              </span>
              <span class="change-info" :class="selectedStock.quote.changePercent > 0 ? 'up' : 'down'">
                {{ selectedStock.quote.change > 0 ? '+' : '' }}{{ selectedStock.quote.change?.toFixed(2) }}
                ({{ selectedStock.quote.changePercent > 0 ? '+' : '' }}{{ selectedStock.quote.changePercent?.toFixed(2) }}%)
              </span>
            </div>
            <div class="quote-details" v-if="selectedStock.quote">
              <div class="detail-item"><span class="label">开盘</span><span>{{ selectedStock.quote.open?.toFixed(2) }}</span></div>
              <div class="detail-item"><span class="label">最高</span><span class="text-up">{{ selectedStock.quote.high?.toFixed(2) }}</span></div>
              <div class="detail-item"><span class="label">最低</span><span class="text-down">{{ selectedStock.quote.low?.toFixed(2) }}</span></div>
              <div class="detail-item"><span class="label">成交量</span><span>{{ (selectedStock.quote.volume / 10000).toFixed(0) }}万手</span></div>
              <div class="detail-item"><span class="label">成交额</span><span>{{ selectedStock.quote.amount?.toFixed(0) }}万</span></div>
              <div class="detail-item"><span class="label">换手率</span><span>{{ selectedStock.quote.turnover?.toFixed(2) }}%</span></div>
            </div>
          </div>
          <el-button @click="selectedStock = null" round>返回列表</el-button>
        </div>
      </el-card>
    </div>

    <!-- Main Content: Rankings -->
    <div class="market-content" v-if="!selectedStock">
      <el-tabs v-model="activeTab" class="dark-tabs">
        <el-tab-pane label="涨幅榜" name="gainers">
          <el-table :data="gainers" size="small" class="dark-table" v-loading="loading" empty-text="暂无数据" @row-click="clickRow">
            <el-table-column prop="symbol" label="代码" width="90" />
            <el-table-column prop="name" label="名称" width="120" />
            <el-table-column label="最新价" width="100" sortable sort-by="quote.price">
              <template #default="{ row }">{{ row.quote?.price?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="涨跌幅" width="110" sortable sort-by="quote.changePercent">
              <template #default="{ row }">
                <span :class="row.quote?.changePercent > 0 ? 'text-up' : 'text-down'">
                  {{ row.quote?.changePercent > 0 ? '+' : '' }}{{ row.quote?.changePercent?.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="涨跌额" width="100">
              <template #default="{ row }">
                <span :class="row.quote?.change > 0 ? 'text-up' : 'text-down'">
                  {{ row.quote?.change > 0 ? '+' : '' }}{{ row.quote?.change?.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="成交量(万)" width="120">
              <template #default="{ row }">{{ row.quote?.volume ? (row.quote.volume / 10000).toFixed(0) : '-' }}</template>
            </el-table-column>
            <el-table-column label="成交额(万)">
              <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="跌幅榜" name="losers">
          <el-table :data="losers" size="small" class="dark-table" v-loading="loading" empty-text="暂无数据" @row-click="clickRow">
            <el-table-column prop="symbol" label="代码" width="90" />
            <el-table-column prop="name" label="名称" width="120" />
            <el-table-column label="最新价" width="100">
              <template #default="{ row }">{{ row.quote?.price?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="涨跌幅" width="110">
              <template #default="{ row }">
                <span :class="row.quote?.changePercent > 0 ? 'text-up' : 'text-down'">
                  {{ row.quote?.changePercent > 0 ? '+' : '' }}{{ row.quote?.changePercent?.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="涨跌额" width="100">
              <template #default="{ row }">
                <span :class="row.quote?.change > 0 ? 'text-up' : 'text-down'">
                  {{ row.quote?.change > 0 ? '+' : '' }}{{ row.quote?.change?.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="成交量(万)" width="120">
              <template #default="{ row }">{{ row.quote?.volume ? (row.quote.volume / 10000).toFixed(0) : '-' }}</template>
            </el-table-column>
            <el-table-column label="成交额(万)">
              <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="成交额榜" name="volume">
          <el-table :data="topVolume" size="small" class="dark-table" v-loading="loading" empty-text="暂无数据" @row-click="clickRow">
            <el-table-column prop="symbol" label="代码" width="90" />
            <el-table-column prop="name" label="名称" width="120" />
            <el-table-column label="最新价" width="100">
              <template #default="{ row }">{{ row.quote?.price?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="涨跌幅" width="110">
              <template #default="{ row }">
                <span :class="row.quote?.changePercent > 0 ? 'text-up' : 'text-down'">
                  {{ row.quote?.changePercent > 0 ? '+' : '' }}{{ row.quote?.changePercent?.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="涨跌额" width="100">
              <template #default="{ row }">
                <span :class="row.quote?.change > 0 ? 'text-up' : 'text-down'">
                  {{ row.quote?.change > 0 ? '+' : '' }}{{ row.quote?.change?.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="成交量(万)" width="120">
              <template #default="{ row }">{{ row.quote?.volume ? (row.quote.volume / 10000).toFixed(0) : '-' }}</template>
            </el-table-column>
            <el-table-column label="成交额(万)">
              <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="热门股票" name="hot">
          <el-table :data="hotStocks" size="small" class="dark-table" v-loading="loading" empty-text="暂无数据" @row-click="clickRow">
            <el-table-column prop="symbol" label="代码" width="90" />
            <el-table-column prop="name" label="名称" width="120" />
            <el-table-column label="最新价" width="100">
              <template #default="{ row }">{{ row.quote?.price?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="涨跌幅" width="110">
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

      <!-- Register CTA -->
      <div class="market-cta">
        <div class="cta-box">
          <h3>登录解锁更多功能</h3>
          <p>自选股管理、AI智能分析、实时预警、API接口...</p>
          <div class="cta-buttons">
            <el-button type="primary" size="large" round @click="$router.push('/login')">立即登录</el-button>
            <el-button size="large" round @click="$router.push('/register')">免费注册</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="market-footer">
      <p>Copyright &copy; 2026 云南意念科技有限责任公司 滇ICP备10000001号-1 | v2026.03.26</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Search } from '@element-plus/icons-vue'
import { API_BASE } from '../utils/config'

const router = useRouter()

// Search
const searchInput = ref('')
const searchResults = ref([])

// Market data
const loading = ref(false)
const indicesLoading = ref(false)
const activeTab = ref('gainers')
const gainers = ref([])
const losers = ref([])
const topVolume = ref([])
const hotStocks = ref([])
const indices = ref([])
const selectedStock = ref(null)

const doSearch = async () => {
  if (!searchInput.value || searchInput.value.length < 1) return
  try {
    const res = await axios.get(`${API_BASE}/stocks/search?q=${encodeURIComponent(searchInput.value)}`)
    searchResults.value = res.data.data?.stocks || []
  } catch (e) { searchResults.value = [] }
}

const selectStock = async (item) => {
  searchResults.value = []
  try {
    const res = await axios.get(`${API_BASE}/stocks/${item.symbol}?market=${item.market}`)
    selectedStock.value = res.data.data?.stock || item
  } catch (e) {
    selectedStock.value = item
  }
}

const clickRow = (row) => {
  selectedStock.value = row
}

const loadMarketData = async () => {
  loading.value = true
  try {
    const [g, l, v, h] = await Promise.all([
      axios.get(`${API_BASE}/stocks/rank/gainers?limit=20`),
      axios.get(`${API_BASE}/stocks/rank/losers?limit=20`),
      axios.get(`${API_BASE}/stocks/rank/volume?limit=20`),
      axios.get(`${API_BASE}/stocks/hot/list?limit=10`)
    ])
    gainers.value = g.data.data?.stocks || []
    losers.value = l.data.data?.stocks || []
    topVolume.value = v.data.data?.stocks || []
    hotStocks.value = h.data.data?.stocks || []
  } catch (e) { /* failed to load */ }
  finally { loading.value = false }
}

const loadIndices = async () => {
  indicesLoading.value = true
  try {
    const res = await axios.get(`${API_BASE}/market/indices`)
    indices.value = res.data.data?.indices || []
  } catch (e) { /* use fallback */ }
  finally { indicesLoading.value = false }
}

onMounted(() => {
  loadMarketData()
  loadIndices()
})
</script>

<style scoped>
.market-page { background: #0f0f23; min-height: 100vh; }

/* Header */
.market-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 32px; background: rgba(15,15,35,0.9); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(45,45,68,0.5); position: sticky; top: 0; z-index: 100; }
.header-left { display: flex; align-items: center; }
.brand { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.brand-icon { font-size: 24px; }
.brand-text { background: linear-gradient(135deg, #e94560, #ff6b6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.header-center { position: relative; }
.header-right { display: flex; gap: 10px; }
.search-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 8px; margin-top: 4px; max-height: 300px; overflow-y: auto; z-index: 200; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
.search-item { padding: 10px 16px; display: flex; gap: 12px; align-items: center; cursor: pointer; transition: background 0.2s; }
.search-item:hover { background: rgba(233,69,96,0.1); }
.search-symbol { color: #e94560; font-weight: 600; font-size: 14px; min-width: 70px; }
.search-name { color: #e2e8f0; font-size: 14px; flex: 1; }
.search-market { color: #4a5568; font-size: 12px; }

/* Indices Bar */
.indices-bar { display: flex; gap: 32px; padding: 12px 32px; background: #13132b; border-bottom: 1px solid rgba(45,45,68,0.3); overflow-x: auto; }
.index-item { display: flex; align-items: center; gap: 10px; min-width: 200px; }
.index-item.placeholder { opacity: 0.4; }
.index-name { color: #a0aec0; font-size: 13px; font-weight: 500; }
.index-price { color: #f7fafc; font-size: 15px; font-weight: 600; }
.index-change { font-size: 13px; font-weight: 500; }

/* Stock Detail */
.stock-detail { padding: 20px 32px; }
.detail-card { background: #1a1a2e; border-color: #2d2d44; }
.detail-card :deep(.el-card__body) { padding: 24px; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
.detail-header h2 { color: #f7fafc; margin-bottom: 12px; font-size: 24px; }
.symbol-tag { font-size: 14px; color: #718096; font-weight: 400; margin-left: 8px; }
.quote-row { margin-bottom: 16px; }
.current-price { font-size: 32px; font-weight: 700; margin-right: 12px; }
.up { color: #ef4444; }
.down { color: #22c55e; }
.change-info { font-size: 16px; }
.quote-details { display: flex; gap: 24px; flex-wrap: wrap; }
.detail-item { display: flex; gap: 6px; font-size: 13px; color: #a0aec0; }
.detail-item .label { color: #4a5568; }
.detail-item span:last-child { color: #e2e8f0; }

/* Content */
.market-content { padding: 24px 32px; max-width: 1200px; margin: 0 auto; }
.dark-tabs :deep(.el-tabs__nav-wrap::after) { background: #2d2d44; }
.dark-tabs :deep(.el-tabs__item) { color: #718096; font-size: 15px; font-weight: 500; }
.dark-tabs :deep(.el-tabs__item.is-active) { color: #e94560; }
.dark-tabs :deep(.el-tabs__item:hover) { color: #e94560; }
.dark-table { background: transparent; cursor: pointer; }
.dark-table :deep(.el-table__header th) { background: #16213e !important; color: #a0aec0; border-bottom: 1px solid #2d2d44; font-weight: 500; }
.dark-table :deep(.el-table__row) { background: transparent; }
.dark-table :deep(.el-table__row:hover > td) { background: rgba(233,69,96,0.06) !important; }
.dark-table :deep(.el-table__body td) { border-bottom: 1px solid rgba(45,45,68,0.4); color: #e2e8f0; }
.dark-table :deep(.el-table__empty-text) { color: #4a5568; }
.text-up { color: #ef4444; font-weight: 600; }
.text-down { color: #22c55e; font-weight: 600; }

/* CTA */
.market-cta { margin-top: 48px; }
.cta-box { text-align: center; padding: 48px; background: linear-gradient(135deg, rgba(233,69,96,0.08), rgba(99,179,237,0.05)); border: 1px solid rgba(233,69,96,0.15); border-radius: 16px; }
.cta-box h3 { color: #f7fafc; font-size: 22px; margin-bottom: 8px; }
.cta-box p { color: #718096; font-size: 14px; margin-bottom: 24px; }
.cta-buttons { display: flex; gap: 12px; justify-content: center; }

/* Footer */
.market-footer { text-align: center; padding: 32px; border-top: 1px solid #2d2d44; margin-top: 48px; }
.market-footer p { font-size: 12px; color: #2d2d44; }

/* Responsive */
@media (max-width: 768px) {
  .market-header { flex-direction: column; gap: 12px; padding: 12px 16px; }
  .header-center { width: 100%; }
  .header-center .el-input { width: 100% !important; }
  .indices-bar { padding: 10px 16px; gap: 16px; }
  .market-content { padding: 16px; }
  .quote-details { gap: 12px; }
  .cta-box { padding: 24px; }
}
</style>
