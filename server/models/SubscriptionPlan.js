const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: true,
    enum: ['Free', 'Pro', 'Enterprise']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,

  // 价格信息
  pricing: {
    monthly: {
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'CNY'
      }
    },
    yearly: {
      amount: {
        type: Number
      },
      currency: {
        type: String,
        default: 'CNY'
      }
    }
  },

  // Token配额
  tokens: {
    monthly: {
      type: Number,
      required: true
    },
    rollover: {
      type: Boolean,
      default: false
    }
  },

  // 访问权限
  features: [{
    name: String,
    included: Boolean
  }],

  // 限制
  limits: {
    apiCallsPerMonth: Number,
    apiCallsPerDay: Number,
    concurrentRequests: Number,
    maxTeamSize: Number,
    customModels: {
      type: Boolean,
      default: false
    }
  },

  // Stripe配置
  stripePriceId: {
    monthly: String,
    yearly: String
  },

  // 试用期
  trialDays: {
    type: Number,
    default: 0
  },

  // 优先级
  priority: {
    type: Number,
    default: 0
  },

  // 状态
  isActive: {
    type: Boolean,
    default: true
  },

  // 推荐标记
  isRecommended: {
    type: Boolean,
    default: false
  },

  // 显示顺序
  order: {
    type: Number,
    default: 0
  },

  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 索引
subscriptionPlanSchema.index({ slug: 1 });
subscriptionPlanSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
