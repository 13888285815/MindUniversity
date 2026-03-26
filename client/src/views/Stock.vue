<template>
  <div class="stock-page">
    <el-row :gutter="20">
      <!-- 左侧：K线图和分时图 -->
      <el-col :span="16">
        <!-- 股票信息头 -->
        <div class="stock-header">
          <div class="stock-info">
            <h2>{{ stock?.name || '请搜索股票' }} <span class="stock-symbol">{{ symbol || '' }}</span></h2>
            <div class="quote-row" v-if="stock?.quote">
              <span class="current-price" :class="stock.quote.changePercent > 0 ? 'up' : 'down'">
                {{ stock.quote.price?.toFixed(2) }}
              </span>
              <span class="change-info" :class="stock.quote.changePercent > 0 ? 'up' : 'down'">
                {{ stock.quote.change > 0 ? '+' : '' }}{{ stock.quote.change?.toFixed(2) }}
                ({{ stock.quote.changePercent > 0 ? '+' : '' }}{{ stock.quote.changePercent?.toFixed(2) }}%)
              </span>
            </div>
            <div class="quote-detail" v-if="stock?.quote">
              <span>开: {{ stock.quote.open?.toFixed(2) }}</span>
              <span>高: {{ stock.quote.high?.toFixed(2) }}</span>
              <span>低: {{ stock.quote.low?.toFixed(2) }}</span>
              <span>量: {{ (stock.quote.volume / 10000).toFixed(0) }}万手</span>
              <span>额: {{ stock.quote.amount?.toFixed(0) }}万</span>
              <span>换手: {{ stock.quote.turnover?.toFixed(2) }}%</span>
            </div>
          </div>
          <div class="stock-actions">
            <el-button type="primary" @click="addWatchlist" :icon="Star" round>自选</el-button>
            <el-button type="success" @click="requestAI" :icon="MagicStick" round>AI分析</el-button>
            <el-button @click="createAlert" :icon="Bell" round>预警</el-button>
          </div>
        </div>

        <!-- K线图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <el-radio-group v-model="chartType" size="small" @change="loadData">
                <el-radio-button label="intraday">分时</el-radio-button>
                <el-radio-button label="kline">日K</el-radio-button>
                <el-radio-button label="week">周K</el-radio-button>
                <el-radio-button label="month">月K</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartRef" style="height: 450px;"></div>
        </el-card>
      </el-col>

      <!-- 右侧：基本面和AI分析 -->
      <el-col :span="8">
        <!-- 基本面 -->
        <el-card class="info-card">
          <template #header><span class="card-title">📋 基本面</span></template>
          <div class="fundamentals" v-if="stock?.fundamentals">
            <div class="fund-item" v-for="item in fundItems" :key="item.label">
              <span class="fund-label">{{ item.label }}</span>
              <span class="fund-value">{{ item.value }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无基本面数据" />
        </el-card>

        <!-- 五档盘口 -->
        <el-card class="info-card" style="margin-top: 16px;">
          <template #header><span class="card-title">📊 五档盘口</span></template>
          <div class="order-book" v-if="stock?.quote">
            <div class="ask-orders">
              <div v-for="i in 4" :key="'ask'+i" class="order-row">
                <span class="order-level">卖{{ 5-i }}</span>
                <div class="order-bar ask-bar" :style="{ width: getBarWidth(stock.quote.askVolume[4-i]) + '%' }"></div>
                <span class="order-vol">{{ stock.quote.askVolume[4-i] }}</span>
                <span class="order-price down">{{ stock.quote.askPrice[4-i]?.toFixed(2) }}</span>
              </div>
            </div>
            <div class="current-price-bar">
              <span class="current-label">最新</span>
              <span class="current-val" :class="stock.quote.changePercent > 0 ? 'up' : 'down'">
                {{ stock.quote.price?.toFixed(2) }}
              </span>
            </div>
            <div class="bid-orders">
              <div v-for="i in 5" :key="'bid'+i" class="order-row">
                <span class="order-level">买{{ i }}</span>
                <div class="order-bar bid-bar" :style="{ width: getBarWidth(stock.quote.bidVolume[i-1]) + '%' }"></div>
                <span class="order-vol">{{ stock.quote.bidVolume[i-1] }}</span>
                <span class="order-price up">{{ stock.quote.bidPrice[i-1]?.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 最新AI分析 -->
        <el-card class="info-card" style="margin-top: 16px;" v-if="analysis">
          <template #header><span class="card-title">🤖 AI分析结果</span></template>
          <div class="ai-result">
            <div class="signal-badge" :class="analysis.signal">
              {{ signalLabel }}
            </div>
            <div class="score-section">
              <div class="score-item" v-for="(val, key) in analysis.score" :key="key">
                <span class="score-label">{{ scoreLabels[key] }}</span>
                <el-progress :percentage="val" :color="getScoreColor(val)" :stroke-width="8" :show-text="false" />
                <span class="score-val">{{ val }}</span>
              </div>
            </div>
            <p class="ai-summary">{{ analysis.summary }}</p>
            <div class="price-targets">
              <span>目标价: <strong class="up">{{ analysis.targetPrice }}</strong></span>
              <span>止损价: <strong class="down">{{ analysis.stopLoss }}</strong></span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Star, MagicStick, Bell } from '@element-plus/icons-vue'

const API = 'http://localhost:3000/api'
const route = useRoute()

const symbol = computed(() => route.query.symbol || '600519')
const market = computed(() => route.query.market || 'SH')
const stock = ref(null)
const chartType = ref('kline')
const chartRef = ref(null)
let chart = null
const analysis = ref(null)

const fundItems = computed(() => {
  if (!stock.value?.fundamentals) return []
  const f = stock.value.fundamentals
  return [
    { label: '市盈率(PE)', value: f.pe?.toFixed(1) || 'N/A' },
    { label: '市净率(PB)', value: f.pb?.toFixed(1) || 'N/A' },
    { label: '每股收益', value: f.eps?.toFixed(2) || 'N/A' },
    { label: '净资产收益率', value: f.roe ? f.roe.toFixed(1) + '%' : 'N/A' },
    { label: '总市值', value: f.marketCap ? f.marketCap.toFixed(0) + '亿' : 'N/A' },
    { label: '股息率', value: f.dividendYield ? f.dividendYield.toFixed(2) + '%' : 'N/A' },
    { label: '毛利率', value: f.grossMargin ? f.grossMargin.toFixed(1) + '%' : 'N/A' },
    { label: '营收增长', value: f.revenueGrowth ? f.revenueGrowth.toFixed(1) + '%' : 'N/A' }
  ]
})

const signalLabel = computed(() => {
  const labels = { strong_buy: '强烈买入', buy: '买入', neutral: '中性', sell: '卖出', strong_sell: '强烈卖出' }
  return labels[analysis.value?.signal] || '中性'
})

const scoreLabels = { overall: '综合', technical: '技术', fundamental: '基本面', risk: '风险', sentiment: '情绪' }

const getScoreColor = (val) => val >= 70 ? '#2ed573' : val >= 40 ? '#ffa502' : '#ff4757'

const getBarWidth = (vol) => Math.min(100, (vol / 600) * 100)

const addWatchlist = async () => {
  try {
    await axios.post(`${API}/stocks/watchlist/add`, { symbol: symbol.value, market: market.value })
    ElMessage.success('已添加到自选股')
  } catch (e) { ElMessage.error(e.response?.data?.message || '添加失败') }
}

const requestAI = async () => {
  try {
    ElMessage.info('AI正在分析中...')
    const res = await axios.post(`${API}/ai/analyze`, { symbol: symbol.value, market: market.value, type: 'comprehensive' })
    analysis.value = res.data.data
    ElMessage.success('分析完成')
  } catch (e) { ElMessage.error(e.response?.data?.message || '分析失败') }
}

const createAlert = () => {
  ElMessage.info('预警设置功能开发中')
}

const loadData = async () => {
  try {
    const [stockRes, klineRes] = await Promise.all([
      axios.get(`${API}/stocks/${symbol.value}?market=${market.value}`),
      chartType.value === 'intraday'
        ? axios.get(`${API}/market/intraday/${symbol.value}?market=${market.value}`)
        : axios.get(`${API}/market/kline/${symbol.value}?market=${market.value}&period=${chartType.value === 'week' ? 'week' : chartType.value === 'month' ? 'month' : 'day'}`)
    ])
    stock.value = stockRes.data.data.stock
    await nextTick()
    renderChart(chartType.value === 'intraday' ? klineRes.data.data : klineRes.data.data.klines)
  } catch (e) {
    console.error('加载数据失败:', e)
    // 生成模拟K线渲染
    stock.value = { symbol: symbol.value, name: '贵州茅台', market: market.value, quote: { price: 1688.50, change: 12.30, changePercent: 0.73, open: 1675.00, high: 1695.00, low: 1670.00, close: 1676.20, volume: 35000, amount: 589000, turnover: 2.78, bidPrice: [1688.49,1688.48,1688.47,1688.46,1688.45], bidVolume: [120,200,350,180,90], askPrice: [1688.51,1688.52,1688.53,1688.54,1688.55], askVolume: [150,220,180,300,160] }, fundamentals: { pe: 33.2, pb: 10.5, eps: 50.86, roe: 31.5, marketCap: 21200, dividendYield: 1.56, grossMargin: 91.2, revenueGrowth: 16.5 } }
    await nextTick()
    renderMockChart()
  }
}

const renderChart = (data) => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, 'dark')

  if (chartType.value === 'intraday') {
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: data.map(d => d.time), axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: '#2d2d44' } } },
      series: [
        { name: '价格', type: 'line', data: data.map(d => d.price), smooth: true, lineStyle: { color: '#e94560', width: 2 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(233,69,96,0.3)' }, { offset: 1, color: 'rgba(233,69,96,0)' }]) }, symbol: 'none' },
        { name: '均价', type: 'line', data: data.map(d => d.avgPrice), smooth: true, lineStyle: { color: '#ffa502', width: 1 }, symbol: 'none' }
      ]
    })
  } else {
    const dates = data.map(d => d.date)
    const ohlc = data.map(d => [d.open, d.close, d.low, d.high])
    const volumes = data.map(d => d.volume)
    const colors = data.map(d => d.close >= d.open ? '#ff4757' : '#2ed573')

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: ['K线', '成交量'], textStyle: { color: '#a0aec0' } },
      grid: [{ left: 60, right: 20, top: 30, height: '55%' }, { left: 60, right: 20, top: '72%', height: '20%' }],
      xAxis: [{ type: 'category', data: dates, gridIndex: 0, axisLabel: { fontSize: 10, color: '#718096' }, axisLine: { lineStyle: { color: '#2d2d44' } } }, { type: 'category', data: dates, gridIndex: 1, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#2d2d44' } } }],
      yAxis: [{ type: 'value', scale: true, gridIndex: 0, splitLine: { lineStyle: { color: '#2d2d44' } }, axisLabel: { color: '#718096' } }, { type: 'value', scale: true, gridIndex: 1, splitLine: { show: false }, axisLabel: { color: '#718096' } }],
      series: [
        { name: 'K线', type: 'candlestick', data: ohlc, xAxisIndex: 0, yAxisIndex: 0, itemStyle: { color: '#ff4757', color0: '#2ed573', borderColor: '#ff4757', borderColor0: '#2ed573' } },
        { name: 'MA5', type: 'line', data: data.map(d => d.ma5), xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#ffa502' } },
        { name: 'MA20', type: 'line', data: data.map(d => d.ma20), xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#63b3ed' } },
        { name: '成交量', type: 'bar', data: volumes.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })), xAxisIndex: 1, yAxisIndex: 1 }
      ]
    })
  }
}

const renderMockChart = () => {
  const data = []
  let base = 1680
  for (let i = 100; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '')
    const change = (Math.random() - 0.48) * 30
    const open = base; const close = base + change
    const high = Math.max(open, close) * 1.005; const low = Math.min(open, close) * 0.995
    data.push({ date: dateStr, open: +open.toFixed(2), close: +close.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), volume: Math.floor(Math.random() * 50000 + 10000), ma5: +(base - 5 + Math.random() * 10).toFixed(2), ma20: +(base - 15 + Math.random() * 20).toFixed(2) })
    base = close
  }
  renderChart(data)
}

onMounted(loadData)
watch([symbol, chartType], loadData)
</script>

<style scoped>
.stock-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding: 16px; background: #1a1a2e; border-radius: 12px; border: 1px solid #2d2d44; }
.stock-info h2 { font-size: 22px; color: #f7fafc; margin-bottom: 8px; }
.stock-symbol { font-size: 14px; color: #718096; font-weight: 400; }
.current-price { font-size: 32px; font-weight: 800; margin-right: 12px; }
.change-info { font-size: 16px; }
.up { color: #ff4757; }
.down { color: #2ed573; }
.quote-detail { display: flex; gap: 16px; margin-top: 8px; font-size: 13px; color: #a0aec0; }
.stock-actions { display: flex; gap: 10px; }
.chart-card { border-radius: 12px; }
.chart-header { display: flex; justify-content: space-between; align-items: center; }
.info-card { border-radius: 12px; }
.card-title { font-weight: 600; }
.fundamentals { display: flex; flex-direction: column; gap: 8px; }
.fund-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #2d2d44; font-size: 13px; }
.fund-label { color: #718096; }
.fund-value { color: #e2e8f0; font-weight: 500; }
.order-book { font-size: 12px; }
.order-row { display: flex; align-items: center; gap: 6px; padding: 3px 0; position: relative; }
.order-level { width: 30px; color: #718096; }
.order-bar { position: absolute; right: 80px; height: 100%; opacity: 0.15; border-radius: 2px; }
.ask-bar { background: #2ed573; }
.bid-bar { background: #ff4757; }
.order-vol { color: #a0aec0; flex: 1; text-align: right; }
.order-price { width: 60px; text-align: right; font-weight: 600; }
.order-price.up { color: #ff4757; }
.order-price.down { color: #2ed573; }
.current-price-bar { text-align: center; padding: 8px; margin: 4px 0; background: rgba(233,69,96,0.1); border-radius: 6px; }
.current-val { font-size: 22px; font-weight: 800; }
.ai-result { }
.signal-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; margin-bottom: 16px; }
.signal-badge.strong_buy, .signal-badge.buy { background: rgba(255,71,87,0.2); color: #ff4757; }
.signal-badge.neutral { background: rgba(255,165,2,0.2); color: #ffa502; }
.signal-badge.sell, .signal-badge.strong_sell { background: rgba(46,213,115,0.2); color: #2ed573; }
.score-section { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.score-item { display: flex; align-items: center; gap: 8px; }
.score-label { width: 50px; font-size: 12px; color: #718096; }
.score-val { width: 30px; text-align: right; font-size: 13px; font-weight: 600; }
.ai-summary { font-size: 13px; color: #a0aec0; line-height: 1.6; margin-bottom: 12px; padding: 10px; background: #16213e; border-radius: 8px; }
.price-targets { display: flex; justify-content: space-between; font-size: 13px; color: #a0aec0; }
</style>
