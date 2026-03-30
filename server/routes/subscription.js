/**
 * 订阅管理系统 - 参考Crunchbase实现
 * 分层订阅 + 验证系统 + AI API Tokens计费
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');

// ==================== Models ====================

// Subscription Plan Model
const SubscriptionPlan = mongoose.model('SubscriptionPlan', new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Free, Starter, Pro, Enterprise
  displayName: { type: Map, of: String }, // 多语言显示名称
  price: { type: Number, required: true }, // 月费（人民币）
  currency: { type: String, default: 'CNY' },
  features: [{ type: String }], // 功能列表
  apiTokensPerMonth: { type: Number, default: 0 }, // 每月API Token配额
  maxApiCallsPerDay: { type: Number, default: 100 }, // 每日API调用限制
  maxConcurrentRequests: { type: Number, default: 5 }, // 并发请求限制
  supportLevel: { type: String, enum: ['community', 'email', 'priority', 'dedicated'], default: 'community' },
  discount: { type: Number, default: 0 }, // 折扣百分比
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}));

// User Subscription Model
const UserSubscription = mongoose.model('UserSubscription', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { 
    type: String, 
    enum: ['trial', 'active', 'paused', 'cancelled', 'expired'], 
    default: 'trial' 
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  trialUsed: { type: Boolean, default: false },
  tokensRemaining: { type: Number, default: 0 }, // 当前剩余Token数
  tokensMonthly: { type: Number, default: 0 }, // 每月Token总量
  tokensResetDate: { type: Date }, // Token重置日期
  paymentMethod: { type: String }, // 'stripe', 'alipay', 'wechat', 'manual'
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  metadata: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

// API Token Usage Log
const ApiUsageLog = mongoose.model('ApiUsageLog', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSubscription', index: true },
  model: { type: String, required: true }, // gpt-4, claude-3, etc.
  tokensUsed: { type: Number, required: true },
  promptTokens: { type: Number },
  completionTokens: { type: Number },
  cost: { type: Number, default: 0 }, // 实际成本（美元）
  requestType: { type: String, enum: ['chat', 'embedding', 'image', 'audio', 'other'], default: 'chat' },
  status: { type: String, enum: ['success', 'failed', 'refunded'], default: 'success' },
  errorMessage: { type: String },
  metadata: { type: Map, of: String },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
}));

// Invoice Model
const Invoice = mongoose.model('Invoice', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSubscription', index: true },
  invoiceNumber: { type: String, required: true, unique: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  subtotal: { type: Number, required: }, // 小计
  discount: { type: Number, default: 0 }, // 折扣金额
  tax: { type: Number, default: 0 }, // 税费
  total: { type: Number, required: }, // 总金额
  currency: { type: String, default: 'CNY' },
  status: { type: String, enum: ['draft', 'open', 'paid', 'void', 'uncollectible'], default: 'open' },
  paymentMethod: { type: String },
  paymentDate: { type: Date },
  stripeInvoiceId: { type: String },
  pdfUrl: { type: String },
  items: [{
    description: { type: String },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number },
    amount: { type: Number }
  }],
  metadata: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now }
}));

// ==================== Utility Functions ====================

// Generate invoice number
const generateInvoiceNumber = async () => {
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}`;
  const count = await Invoice.countDocuments({ invoiceNumber: new RegExp(`^${prefix}`) });
  return `${prefix}-${(count + 1).toString().padStart(6, '0')}`;
};

// Calculate token cost (simplified pricing model)
const calculateTokenCost = (model, tokens) => {
  const pricing = {
    'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    'text-embedding-ada-002': { input: 0.0001, output: 0 },
  };
  
  const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
  const cost = (tokens.input * modelPricing.input + tokens.output * modelPricing.output) / 1000;
  return Math.round(cost * 1000000) / 1000000; // Round to 6 decimals
};

// Middleware: Verify API subscription
const verifyApiAccess = async (req, res, next) => {
  try {
    const userId = req.userId;
    const subscription = await UserSubscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('planId');
    
    if (!subscription) {
      return res.status(403).json({
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'Active subscription required to access API'
      });
    }
    
    // Check token balance
    if (subscription.tokensRemaining <= 0) {
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        message: 'API token quota exceeded. Please upgrade your subscription.'
      });
    }
    
    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsage = await ApiUsageLog.countDocuments({
      userId,
      createdAt: { $gte: today }
    });
    
    if (todayUsage >= subscription.planId.maxApiCallsPerDay) {
      return res.status(429).json({
        error: 'DAILY_LIMIT_EXCEEDED',
        message: 'Daily API call limit exceeded. Please try again tomorrow.'
      });
    }
    
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('API access verification error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to verify API access' });
  }
};

// ==================== Routes ====================

/**
 * Get all subscription plans (public)
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ active: true })
      .sort({ sortOrder: 1, price: 1 })
      .lean();
    
    res.json({
      success: true,
      plans: plans.map(p => ({
        id: p._id,
        name: p.name,
        displayName: p.displayName,
        price: p.price,
        currency: p.currency,
        features: p.features,
        apiTokensPerMonth: p.apiTokensPerMonth,
        maxApiCallsPerDay: p.maxApiCallsPerDay,
        maxConcurrentRequests: p.maxConcurrentRequests,
        supportLevel: p.supportLevel,
        discount: p.discount
      }))
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, error: 'Failed to get subscription plans' });
  }
});

/**
 * Get current user's subscription
 */
router.get('/current', async (req, res) => {
  try {
    const userId = req.userId;
    const subscription = await UserSubscription.findOne({ userId })
      .populate('planId')
      .lean();
    
    if (!subscription) {
      return res.json({ success: true, subscription: null });
    }
    
    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        plan: {
          id: subscription.planId._id,
          name: subscription.planId.name,
          displayName: subscription.planId.displayName,
          price: subscription.planId.price,
          features: subscription.planId.features
        },
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        tokensRemaining: subscription.tokensRemaining,
        tokensMonthly: subscription.tokensMonthly,
        tokensResetDate: subscription.tokensResetDate
      }
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({ success: false, error: 'Failed to get subscription' });
  }
});

/**
 * Create or update subscription
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { planId, paymentMethod, promoCode } = req.body;
    const userId = req.userId;
    
    // Validate plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.active) {
      return res.status(400).json({ success: false, error: 'Invalid subscription plan' });
    }
    
    // Check existing subscription
    let subscription = await UserSubscription.findOne({ userId });
    
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    const resetDate = new Date(endDate);
    resetDate.setDate(1); // Reset on 1st of next month
    
    if (subscription) {
      // Upgrade/downgrade existing subscription
      subscription.planId = planId;
      subscription.status = 'active';
      subscription.endDate = endDate;
      subscription.tokensMonthly = plan.apiTokensPerMonth;
      subscription.tokensRemaining = plan.apiTokensPerMonth;
      subscription.tokensResetDate = resetDate;
      subscription.updatedAt = new Date();
      await subscription.save();
    } else {
      // Create new subscription
      subscription = new UserSubscription({
        userId,
        planId,
        status: 'active',
        startDate,
        endDate,
        tokensMonthly: plan.apiTokensPerMonth,
        tokensRemaining: plan.apiTokensPerMonth,
        tokensResetDate: resetDate,
        paymentMethod
      });
      await subscription.save();
    }
    
    // Log subscription creation
    await ApiUsageLog.create({
      userId,
      subscriptionId: subscription._id,
      model: 'system',
      tokensUsed: 0,
      requestType: 'other',
      status: 'success',
      metadata: { action: 'subscription_created', plan: plan.name }
    });
    
    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        status: subscription.status,
        endDate: subscription.endDate,
        tokensRemaining: subscription.tokensRemaining
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to create subscription' });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', async (req, res) => {
  try {
    const userId = req.userId;
    const subscription = await UserSubscription.findOne({ userId, status: 'active' });
    
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'No active subscription found' });
    }
    
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();
    
    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      endDate: subscription.endDate
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

/**
 * Resume subscription
 */
router.post('/resume', async (req, res) => {
  try {
    const userId = req.userId;
    const subscription = await UserSubscription.findOne({ userId, cancelAtPeriodEnd: true });
    
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'No cancellable subscription found' });
    }
    
    subscription.cancelAtPeriodEnd = false;
    subscription.status = 'active';
    await subscription.save();
    
    res.json({ success: true, message: 'Subscription resumed' });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({ success: false, error: 'Failed to resume subscription' });
  }
});

/**
 * Get API usage statistics
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.userId;
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(1); // Start of current month
    }
    
    const logs = await ApiUsageLog.find({
      userId,
      createdAt: { $gte: startDate },
      status: 'success'
    }).sort({ createdAt: -1 });
    
    const totalTokens = logs.reduce((sum, log) => sum + log.tokensUsed, 0);
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const totalCalls = logs.length;
    
    // Group by date
    const usageByDate = {};
    logs.forEach(log => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!usageByDate[date]) {
        usageByDate[date] = { tokens: 0, cost: 0, calls: 0 };
      }
      usageByDate[date].tokens += log.tokensUsed;
      usageByDate[date].cost += log.cost;
      usageByDate[date].calls += 1;
    });
    
    // Group by model
    const usageByModel = {};
    logs.forEach(log => {
      if (!usageByModel[log.model]) {
        usageByModel[log.model] = { tokens: 0, cost: 0, calls: 0 };
      }
      usageByModel[log.model].tokens += log.tokensUsed;
      usageByModel[log.model].cost += log.cost;
      usageByModel[log.model].calls += 1;
    });
    
    res.json({
      success: true,
      summary: {
        totalTokens,
        totalCost,
        totalCalls,
        period
      },
      usageByDate,
      usageByModel
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ success: false, error: 'Failed to get usage statistics' });
  }
});

/**
 * Get invoices
 */
router.get('/invoices', async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const invoices = await Invoice.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Invoice.countDocuments({ userId });
    
    res.json({
      success: true,
      invoices: invoices.map(inv => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        total: inv.total,
        currency: inv.currency,
        status: inv.status,
        createdAt: inv.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, error: 'Failed to get invoices' });
  }
});

/**
 * Get subscription dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get subscription
    const subscription = await UserSubscription.findOne({ userId }).populate('planId');
    
    // Get usage stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayCalls = await ApiUsageLog.countDocuments({
      userId,
      createdAt: { $gte: todayStart }
    });
    
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthLogs = await ApiUsageLog.find({
      userId,
      createdAt: { $gte: monthStart },
      status: 'success'
    });
    
    const monthTokens = monthLogs.reduce((sum, log) => sum + log.tokensUsed, 0);
    const monthCost = monthLogs.reduce((sum, log) => sum + log.cost, 0);
    
    res.json({
      success: true,
      subscription: subscription ? {
        planName: subscription.planId.displayName,
        status: subscription.status,
        tokensRemaining: subscription.tokensRemaining,
        tokensMonthly: subscription.tokensMonthly,
        maxApiCallsPerDay: subscription.planId.maxApiCallsPerDay,
        todayCalls,
        endDate: subscription.endDate
      } : null,
      usage: {
        todayCalls,
        monthTokens,
        monthCost,
        remaining: subscription ? subscription.tokensRemaining : 0
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard data' });
  }
});

/**
 * Record API usage (internal)
 */
const recordApiUsage = async (userId, model, tokens, cost, metadata = {}) => {
  try {
    const subscription = await UserSubscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    const log = new ApiUsageLog({
      userId,
      subscriptionId: subscription ? subscription._id : null,
      model,
      tokensUsed: tokens.input + tokens.output,
      promptTokens: tokens.input,
      completionTokens: tokens.output,
      cost,
      requestType: metadata.requestType || 'chat',
      metadata
    });
    
    await log.save();
    
    // Deduct tokens from subscription
    if (subscription) {
      subscription.tokensRemaining -= (tokens.input + tokens.output);
      await subscription.save();
    }
    
    return log;
  } catch (error) {
    console.error('Record API usage error:', error);
    throw error;
  }
};

// ==================== Initialize Default Plans ====================
const initializePlans = async () => {
  const plans = [
    {
      name: 'Free',
      displayName: {
        zh: '免费版',
        en: 'Free',
        fr: 'Gratuit',
        de: 'Kostenlos',
        ja: '無料',
        ar: 'مجاني'
      },
      price: 0,
      currency: 'CNY',
      features: [
        'Basic course access',
        'Limited API calls (100/day)',
        'Community support'
      ],
      apiTokensPerMonth: 50000,
      maxApiCallsPerDay: 100,
      maxConcurrentRequests: 3,
      supportLevel: 'community',
      sortOrder: 1
    },
    {
      name: 'Starter',
      displayName: {
        zh: '基础版',
        en: 'Starter',
        fr: 'Débutant',
        de: 'Starter',
        ja: 'スターター',
        ar: 'المبتدئ'
      },
      price: 99,
      currency: 'CNY',
      features: [
        'All course access',
        '500K API tokens/month',
        '500 API calls/day',
        'Email support'
      ],
      apiTokensPerMonth: 500000,
      maxApiCallsPerDay: 500,
      maxConcurrentRequests: 10,
      supportLevel: 'email',
      sortOrder: 2
    },
    {
      name: 'Pro',
      displayName: {
        zh: '专业版',
        en: 'Pro',
        fr: 'Pro',
        de: 'Pro',
        ja: 'プロ',
        ar: 'محترف'
      },
      price: 299,
      currency: 'CNY',
      features: [
        'All course access',
        '2M API tokens/month',
        '2000 API calls/day',
        'Priority support',
        'Advanced analytics'
      ],
      apiTokensPerMonth: 2000000,
      maxApiCallsPerDay: 2000,
      maxConcurrentRequests: 20,
      supportLevel: 'priority',
      sortOrder: 3
    },
    {
      name: 'Enterprise',
      displayName: {
        zh: '企业版',
        en: 'Enterprise',
        fr: 'Entreprise',
        de: 'Unternehmen',
        ja: 'エンタープライズ',
        ar: 'المؤسسات'
      },
      price: 999,
      currency: 'CNY',
      features: [
        'Unlimited course access',
        'Unlimited API tokens',
        'Unlimited API calls',
        'Dedicated support',
        'SLA guarantee',
        'Custom integrations'
      ],
      apiTokensPerMonth: Infinity,
      maxApiCallsPerDay: Infinity,
      maxConcurrentRequests: 50,
      supportLevel: 'dedicated',
      sortOrder: 4
    }
  ];
  
  for (const plan of plans) {
    await SubscriptionPlan.findOneAndUpdate(
      { name: plan.name },
      plan,
      { upsert: true, new: true }
    );
  }
};

module.exports = {
  router,
  initializePlans,
  verifyApiAccess,
  recordApiUsage,
  UserSubscription,
  ApiUsageLog,
  Invoice
};
