const mongoose = require('mongoose');

// 价格预警 Schema
const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true,
    index: true
  },
  symbol: String,
  market: String,
  name: String,
  // 预警条件
  condition: {
    // 预警类型 (price_above/price_below/change_above/change_below/volume_spike)
    type: {
      type: String,
      enum: ['price_above', 'price_below', 'change_above', 'change_below', 'volume_spike', 'custom'],
      required: true
    },
    // 触发值
    value: {
      type: Number,
      required: true
    },
    // 额外参数
    params: mongoose.Schema.Types.Mixed
  },
  // 预警状态
  status: {
    type: String,
    enum: ['active', 'triggered', 'expired', 'cancelled'],
    default: 'active',
    index: true
  },
  // 触发次数
  triggerCount: {
    type: Number,
    default: 0
  },
  // 最后触发时间
  lastTriggeredAt: Date,
  // 触发时行情
  triggeredQuote: {
    price: Number,
    change: Number,
    changePercent: Number,
    volume: Number
  },
  // 有效期 (null 表示永久)
  expiresAt: Date,
  // 通知方式
  notifications: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  // 备注
  note: String
}, { timestamps: true });

// 索引
alertSchema.index({ user: 1, status: 1 });
alertSchema.index({ stock: 1, status: 1 });
alertSchema.index({ 'condition.type': 1 });

// 静态方法: 获取用户的活跃预警
alertSchema.statics.getActiveAlerts = function(userId) {
  return this.find({ user: userId, status: 'active' })
    .populate('stock', 'symbol name market quote')
    .sort({ createdAt: -1 });
};

// 静态方法: 检查预警是否触发
alertSchema.statics.checkAlerts = async function(symbol, market, quote) {
  const alerts = await this.find({
    symbol,
    market,
    status: 'active',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });

  const triggered = [];

  for (const alert of alerts) {
    let isTriggered = false;
    switch (alert.condition.type) {
      case 'price_above':
        isTriggered = quote.price >= alert.condition.value;
        break;
      case 'price_below':
        isTriggered = quote.price <= alert.condition.value;
        break;
      case 'change_above':
        isTriggered = (quote.changePercent || 0) >= alert.condition.value;
        break;
      case 'change_below':
        isTriggered = (quote.changePercent || 0) <= alert.condition.value;
        break;
      case 'volume_spike':
        isTriggered = quote.volume >= alert.condition.value;
        break;
    }

    if (isTriggered) {
      alert.status = 'triggered';
      alert.triggerCount += 1;
      alert.lastTriggeredAt = new Date();
      alert.triggeredQuote = {
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume
      };
      await alert.save();
      triggered.push(alert);
    }
  }

  return triggered;
};

module.exports = mongoose.model('Alert', alertSchema);
