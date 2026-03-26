const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 基本信息
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: String,
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      validator: function(v) {
        // 至少8字符，包含大小写字母和数字
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
      },
      message: '密码必须至少8字符，包含大小写字母和数字'
    }
  },

  // 邮箱验证
  emailVerification: {
    token: String,
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    expiresAt: Date
  },

  // 订阅信息
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'trial', 'past_due'],
      default: 'trial'
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    trialEndsAt: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    // 订阅特性配置
    features: {
      maxWatchlist: { type: Number, default: 20 },
      maxAlerts: { type: Number, default: 5 },
      aiAnalysisPerDay: { type: Number, default: 3 },
      realtimeData: { type: Boolean, default: false },
      advancedChart: { type: Boolean, default: false },
      portfolioAnalysis: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      customIndicators: { type: Boolean, default: false },
      exportData: { type: Boolean, default: false },
      historicalData: { type: Number, default: 90 } // 天数
    }
  },

  // AI API Token 计费
  tokenBalance: {
    type: Number,
    default: 10000
  },
  totalTokensUsed: {
    type: Number,
    default: 0
  },
  monthlyTokensUsed: {
    type: Number,
    default: 0
  },
  lastBillingDate: {
    type: Date,
    default: Date.now
  },
  // 每日AI分析计数
  dailyAIAnalysisCount: {
    type: Number,
    default: 0
  },
  lastAIAnalysisDate: Date,

  // 个人资料
  profile: {
    fullName: String,
    avatar: String,
    country: String,
    city: String,
    bio: String,
    investmentStyle: {
      type: String,
      enum: ['conservative', 'balanced', 'aggressive', 'day_trader', 'long_term'],
      default: 'balanced'
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'professional'],
      default: 'intermediate'
    }
  },

  // API Keys
  apiKeys: [{
    keyId: String,
    keyPrefix: String,
    keyHash: String,
    name: String,
    permissions: [String],
    rateLimit: Number,
    lastUsedAt: Date,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    isActive: { type: Boolean, default: true }
  }],

  // 账户状态
  isActive: { type: Boolean, default: true },
  role: {
    type: String,
    enum: ['user', 'analyst', 'admin'],
    default: 'user'
  },

  // 最后登录
  lastLoginAt: Date,
  lastLoginIP: String,
  loginCount: { type: Number, default: 0 },

  // 安全: 账户锁定
  loginFailures: { type: Number, default: 0 },
  lockUntil: Date
}, { timestamps: true });

// 索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'subscription.status': 1 });

// 密码加密
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 比较密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 扣除 Token
userSchema.methods.deductTokens = function(amount) {
  if (this.tokenBalance < amount) {
    throw new Error('Token余额不足');
  }
  this.tokenBalance -= amount;
  this.totalTokensUsed += amount;
  this.monthlyTokensUsed += amount;
  return this.save();
};

// 重置每日AI分析计数
userSchema.methods.resetDailyAIAnalysis = function() {
  this.dailyAIAnalysisCount = 0;
  this.lastAIAnalysisDate = new Date();
  return this.save();
};

// 检查是否可以进行AI分析
userSchema.methods.canDoAIAnalysis = function() {
  const today = new Date().toDateString();
  if (this.lastAIAnalysisDate?.toDateString() !== today) {
    this.dailyAIAnalysisCount = 0;
    this.lastAIAnalysisDate = new Date();
  }
  return this.dailyAIAnalysisCount < this.subscription.features.aiAnalysisPerDay;
};

module.exports = mongoose.model('User', userSchema);
