<template>
  <div class="watchlist-page">
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;font-size:18px;">⭐ 我的自选股</span>
          <div style="display:flex;gap:8px;">
            <el-input v-model="searchQuery" placeholder="输入股票代码" prefix-icon="Search" style="width:200px;" clearable @keyup.enter="searchAndAdd" />
            <el-select v-model="addMarket" style="width:90px;">
              <el-option label="SH" value="SH" />
              <el-option label="SZ" value="SZ" />
              <el-option label="HK" value="HK" />
              <el-option label="US" value="US" />
            </el-select>
            <el-button type="primary" @click="searchAndAdd">添加</el-button>
          </div>
        </div>
      </template>
      <el-table :data="stocks" style="width:100%" class="dark-table" empty-text="暂无自选股">
        <el-table-column type="index" width="50" />
        <el-table-column prop="symbol" label="代码" width="100" />
        <el-table-column prop="name" label="名称" width="120" />
        <el-table-column prop="market" label="市场" width="70" />
        <el-table-column label="最新价" width="100">
          <template #default="{ row }">{{ row.quote?.price?.toFixed(2) || '-' }}</template>
        </el-table-column>
        <el-table-column label="涨跌幅" width="110">
          <template #default="{ row }">
            <span :class="(row.quote?.changePercent || 0) > 0 ? 'text-up' : (row.quote?.changePercent || 0) < 0 ? 'text-down' : ''">
              {{ (row.quote?.changePercent || 0) > 0 ? '+' : '' }}{{ (row.quote?.changePercent || 0)?.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="成交额(万)">
          <template #default="{ row }">{{ row.quote?.amount?.toFixed(0) || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="$router.push({ path: '/stock', query: { symbol: row.symbol, market: row.market } })">查看</el-button>
            <el-button size="small" type="danger" link @click="removeStock(row.symbol, row.market)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

import { API_BASE as API } from '../utils/config'
const userStore = useUserStore()
const stocks = ref([])
const searchQuery = ref('')
const addMarket = ref('SH')

const authHeaders = { headers: { Authorization: `Bearer ${userStore.token}` } }

const loadWatchlist = async () => {
  try {
    const res = await axios.get(`${API}/stocks/watchlist/my`, authHeaders)
    stocks.value = res.data.data.stocks || []
  } catch (e) { console.error(e) }
}

const searchAndAdd = async () => {
  if (!searchQuery.value) return ElMessage.warning('请输入股票代码')
  try {
    await axios.post(`${API}/stocks/watchlist/add`, { symbol: searchQuery.value.toUpperCase(), market: addMarket.value }, authHeaders)
    ElMessage.success('已添加到自选')
    searchQuery.value = ''
    loadWatchlist()
  } catch (e) { ElMessage.error(e.response?.data?.message || '添加失败') }
}

const removeStock = async (symbol, market) => {
  try {
    await axios.delete(`${API}/stocks/watchlist/remove`, { ...authHeaders, data: { symbol, market } })
    ElMessage.success('已移除')
    loadWatchlist()
  } catch (e) { ElMessage.error('移除失败') }
}

onMounted(loadWatchlist)
</script>

<style scoped>
.text-up { color: #ff4757; font-weight: 600; }
.text-down { color: #2ed573; font-weight: 600; }
:deep(.dark-table) { --el-table-bg-color: transparent; --el-table-tr-bg-color: transparent; --el-table-header-bg-color: #16213e; --el-table-row-hover-bg-color: #1f2b47; --el-table-text-color: #e2e8f0; --el-table-header-text-color: #a0aec0; --el-table-border-color: #2d2d44; }
</style>
