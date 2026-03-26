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
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  // 订阅信息
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'trial'],
      default: 'trial'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },

  // Token配额和余额
  tokenBalance: {
    type: Number,
    default: 50000 // 免费用户50K tokens
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

  // 学习进度
  enrolledCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    progress: {
      type: Number,
      default: 0
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now
    },
    completedLessons: [{
      type: mongoose.Schema.Types.ObjectId
    }]
  }],

  // 个人资料
  profile: {
    fullName: String,
    avatar: String,
    phone: String,
    country: String,
    city: String,
    bio: String
  },

  // API Keys
  apiKeys: [{
    keyId: String,
    keyPrefix: String,
    keyHash: String,
    name: String,
    permissions: [String],
    lastUsedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // 账户状态
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },

  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // 最后登录
  lastLoginAt: Date,
  lastLoginIP: String
});

// 索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'subscription.status': 1 });

// 密码加密中间件
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

// 比较密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 检查是否需要升级订阅
userSchema.methods.checkTokenLimit = function() {
  const plans = {
    free: 50000,
    pro: 500000,
    enterprise: Infinity
  };

  const limit = plans[this.subscription.plan] || plans.free;
  return this.tokenBalance < limit;
};

// 扣除Tokens
userSchema.methods.deductTokens = function(amount) {
  if (this.tokenBalance < amount) {
    throw new Error('Insufficient token balance');
  }
  this.tokenBalance -= amount;
  this.totalTokensUsed += amount;
  this.monthlyTokensUsed += amount;
  return this.save();
};

// 获取可用Token数
userSchema.methods.getAvailableTokens = function() {
  const plans = {
    free: 50000,
    pro: 500000,
    enterprise: Infinity
  };

  const limit = plans[this.subscription.plan] || plans.free;
  return Math.min(this.tokenBalance, limit);
};

// 更新订阅计划
userSchema.methods.updateSubscription = function(plan, stripeCustomerId, stripeSubscriptionId) {
  this.subscription.plan = plan;
  this.subscription.status = 'active';
  this.subscription.stripeCustomerId = stripeCustomerId;
  this.subscription.stripeSubscriptionId = stripeSubscriptionId;

  // 重置每月配额
  const plans = {
    free: 50000,
    pro: 500000,
    enterprise: Infinity
  };

  this.tokenBalance = plans[plan];
  this.monthlyTokensUsed = 0;
  this.lastBillingDate = new Date();

  return this.save();
};

module.exports = mongoose.model('User', userSchema);
