const mongoose = require('mongoose');

// 自选股列表 Schema
const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    default: '默认自选',
    trim: true
  },
  // 自选股列表
  stocks: [{
    stock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stock'
    },
    symbol: String,
    market: String,
    name: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    // 备注
    note: String,
    // 目标价
    targetPrice: Number,
    // 止损价
    stopLoss: Number,
    // 标签 (观察、持有、已卖出)
    tag: {
      type: String,
      enum: ['watching', 'holding', 'sold', 'research'],
      default: 'watching'
    }
  }],
  // 排序
  sortOrder: [mongoose.Schema.Types.ObjectId],
  // 是否公开
  isPublic: {
    type: Boolean,
    default: false
  },
  // 关注者
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followerCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// 索引
watchlistSchema.index({ user: 1 });
watchlistSchema.index({ isPublic: 1, followerCount: -1 });

// 限制每个用户的自选股数量
watchlistSchema.methods.addStock = async function(stockData) {
  const existing = this.stocks.find(
    s => s.symbol === stockData.symbol && s.market === stockData.market
  );
  if (existing) {
    throw new Error('该股票已在自选列表中');
  }
  
  // 根据订阅计划限制
  const User = mongoose.model('User');
  const user = await User.findById(this.user);
  const planLimits = { free: 20, pro: 100, enterprise: 500 };
  const limit = planLimits[user?.subscription?.plan] || planLimits.free;
  
  if (this.stocks.length >= limit) {
    throw new Error(`当前计划最多添加 ${limit} 只自选股，请升级订阅`);
  }
  
  this.stocks.push(stockData);
  return this.save();
};

// 移除股票
watchlistSchema.methods.removeStock = function(symbol, market) {
  this.stocks = this.stocks.filter(
    s => !(s.symbol === symbol && s.market === market)
  );
  return this.save();
};

module.exports = mongoose.model('Watchlist', watchlistSchema);
