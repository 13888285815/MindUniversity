const mongoose = require('mongoose');

// K线数据 Schema
const klineSchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    index: true
  },
  market: {
    type: String,
    required: true
  },
  // 周期 (1m/5m/15m/30m/60m/day/week/month)
  period: {
    type: String,
    enum: ['1m', '5m', '15m', '30m', '60m', 'day', 'week', 'month'],
    required: true,
    index: true
  },
  // OHLCV
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  // 涨跌
  change: Number,
  changePercent: Number,
  // 均线数据 (可选)
  ma5: Number,
  ma10: Number,
  ma20: Number,
  ma60: Number,
  ma120: Number,
  ma250: Number,
  // 技术指标
  macd: {
    dif: Number,
    dea: Number,
    macd: Number
  },
  kdj: {
    k: Number,
    d: Number,
    j: Number
  },
  rsi: {
    rsi6: Number,
    rsi12: Number,
    rsi24: Number
  },
  boll: {
    upper: Number,
    middle: Number,
    lower: Number
  },
  // 时间戳
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  date: {
    type: String,  // YYYYMMDD 格式
    index: true
  }
}, { timestamps: true });

// 复合索引
klineSchema.index({ symbol: 1, market: 1, period: 1, timestamp: -1 });
klineSchema.index({ symbol: 1, market: 1, period: 1, date: -1 });

// 静态方法: 获取K线数据
klineSchema.statics.getKlineData = async function(symbol, market, period, limit = 200) {
  const query = { symbol, market, period };
  return this.find(query)
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();
};

// 静态方法: 获取最新K线
klineSchema.statics.getLatest = async function(symbol, market, period) {
  return this.findOne({ symbol, market, period })
    .sort({ timestamp: -1 })
    .lean();
};

// 静态方法: 批量更新/插入K线
klineSchema.statics.bulkUpsert = async function(klines) {
  const bulkOps = klines.map(k => ({
    updateOne: {
      filter: { symbol: k.symbol, market: k.market, period: k.period, date: k.date },
      update: { $set: k },
      upsert: true
    }
  }));
  if (bulkOps.length > 0) {
    return this.bulkWrite(bulkOps, { ordered: false });
  }
};

module.exports = mongoose.model('Kline', klineSchema);
