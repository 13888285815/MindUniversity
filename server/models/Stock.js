const mongoose = require('mongoose');

// 股票基本信息 Schema
const stockSchema = new mongoose.Schema({
  // 证券代码
  symbol: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // 证券名称
  name: {
    type: String,
    required: true,
    trim: true
  },
  // 英文简称
  nameEn: String,
  // 市场 (SH/SZ/HK/US)
  market: {
    type: String,
    enum: ['SH', 'SZ', 'HK', 'US'],
    required: true,
    index: true
  },
  // 交易所
  exchange: {
    type: String,
    enum: ['SSE', 'SZSE', 'HKEX', 'NYSE', 'NASDAQ', 'AMEX'],
    default: 'SSE'
  },
  // 类型 (stock/bond/fund/etf/index/futures)
  type: {
    type: String,
    enum: ['stock', 'bond', 'fund', 'etf', 'index', 'futures', 'option'],
    default: 'stock',
    index: true
  },
  // 行业板块
  sector: String,
  industry: String,
  // 概念板块
  concepts: [String],
  // 上市日期
  listDate: Date,
  // 总股本 (万股)
  totalShares: Number,
  // 流通股本 (万股)
  floatShares: Number,
  // 基本面数据
  fundamentals: {
    pe: Number,          // 市盈率
    pb: Number,          // 市净率
    ps: Number,          // 市销率
    eps: Number,         // 每股收益
    bvps: Number,        // 每股净资产
    roe: Number,         // 净资产收益率 (%)
    dividendYield: Number, // 股息率 (%)
    marketCap: Number,   // 总市值 (亿)
    floatMarketCap: Number, // 流通市值 (亿)
    revenue: Number,     // 营业收入 (亿)
    netProfit: Number,   // 净利润 (亿)
    debtRatio: Number,   // 资产负债率 (%)
    currentRatio: Number,
    grossMargin: Number, // 毛利率 (%)
    netMargin: Number,   // 净利率 (%)
    revenueGrowth: Number, // 营收增长率 (%)
    profitGrowth: Number   // 净利润增长率 (%)
  },
  // 实时行情快照
  quote: {
    price: Number,        // 最新价
    open: Number,         // 今开
    high: Number,         // 最高
    low: Number,          // 最低
    close: Number,        // 昨收
    volume: Number,       // 成交量 (手)
    amount: Number,       // 成交额 (万)
    change: Number,       // 涨跌额
    changePercent: Number, // 涨跌幅 (%)
    amplitude: Number,    // 振幅 (%)
    turnover: Number,     // 换手率 (%)
    bidPrice: [Number],   // 买价 (5档)
    bidVolume: [Number],  // 买量 (5档)
    askPrice: [Number],   // 卖价 (5档)
    askVolume: [Number],  // 卖量 (5档)
    timestamp: Date
  },
  // 状态
  status: {
    type: String,
    enum: ['active', 'suspended', 'delisted'],
    default: 'active',
    index: true
  },
  // 涨跌停标记
  limitUp: { type: Boolean, default: false },
  limitDown: { type: Boolean, default: false },
  // 是否热门
  isHot: { type: Boolean, default: false },
  // 标签 (自选、关注等)
  tags: [String],
  // 更新时间
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 索引
stockSchema.index({ symbol: 1, market: 1 });
stockSchema.index({ name: 1 });
stockSchema.index({ sector: 1, type: 1 });
stockSchema.index({ 'quote.changePercent': -1 });
stockSchema.index({ concepts: 1 });

// 静态方法: 搜索股票
stockSchema.statics.searchStocks = async function(keyword, limit = 20) {
  const regex = new RegExp(keyword, 'i');
  return this.find({
    $or: [
      { symbol: regex },
      { name: regex },
      { nameEn: regex }
    ],
    status: 'active'
  }).limit(limit).lean();
};

// 静态方法: 获取热门股票
stockSchema.statics.getHotStocks = async function(limit = 10) {
  return this.find({ isHot: true, status: 'active' })
    .sort({ 'quote.volume': -1 })
    .limit(limit)
    .lean();
};

// 静态方法: 获取涨幅榜
stockSchema.statics.getTopGainers = async function(limit = 20) {
  return this.find({ status: 'active', 'quote.changePercent': { $gt: 0 } })
    .sort({ 'quote.changePercent': -1 })
    .limit(limit)
    .lean();
};

// 静态方法: 获取跌幅榜
stockSchema.statics.getTopLosers = async function(limit = 20) {
  return this.find({ status: 'active', 'quote.changePercent': { $lt: 0 } })
    .sort({ 'quote.changePercent': 1 })
    .limit(limit)
    .lean();
};

// 静态方法: 获取成交额榜
stockSchema.statics.getTopByVolume = async function(limit = 20) {
  return this.find({ status: 'active' })
    .sort({ 'quote.amount': -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('Stock', stockSchema);
