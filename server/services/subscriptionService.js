const { User, SubscriptionPlan } = require('../models');

class SubscriptionService {
  // 初始化订阅计划 (分层订阅体系)
  async initializePlans() {
    const existingPlans = await SubscriptionPlan.countDocuments();
    if (existingPlans > 0) return;

    const plans = [
      {
        name: 'Free',
        slug: 'free',
        description: '免费体验，基础行情浏览和有限分析功能',
        pricing: { monthly: { amount: 0 }, yearly: { amount: 0 } },
        tokens: { monthly: 10000, rollover: false },
        features: [
          { name: '基础行情浏览', included: true },
          { name: '5只自选股', included: true },
          { name: '5个价格预警', included: true },
          { name: '每日3次AI分析', included: true },
          { name: 'K线图 (日K)', included: true },
          { name: '延时行情 (15分钟)', included: true },
          { name: '分时图', included: false },
          { name: '实时行情', included: false },
          { name: '高级技术指标', included: false },
          { name: '基本面分析', included: false },
          { name: 'API访问', included: false },
          { name: '数据导出', included: false }
        ],
        limits: { apiCallsPerDay: 0, apiCallsPerMonth: 0, concurrentRequests: 2 },
        trialDays: 0, priority: 1, order: 1
      },
      {
        name: 'Starter',
        slug: 'starter',
        description: '进阶版，适合个人投资者日常使用',
        pricing: { monthly: { amount: 49 }, yearly: { amount: 490 } },
        tokens: { monthly: 50000, rollover: true },
        features: [
          { name: '实时行情', included: true },
          { name: '50只自选股', included: true },
          { name: '20个价格预警', included: true },
          { name: '每日20次AI分析', included: true },
          { name: '全周期K线 (含分钟级)', included: true },
          { name: '分时图', included: true },
          { name: '技术指标 (MACD/KDJ/RSI/BOLL)', included: true },
          { name: '基本面分析', included: true },
          { name: '板块行情', included: true },
          { name: '数据导出', included: false },
          { name: 'API访问', included: false }
        ],
        limits: { apiCallsPerDay: 0, apiCallsPerMonth: 0, concurrentRequests: 5 },
        trialDays: 7, priority: 2, isRecommended: true, order: 2
      },
      {
        name: 'Pro',
        slug: 'pro',
        description: '专业版，面向专业投资者和量化交易者',
        pricing: { monthly: { amount: 199 }, yearly: { amount: 1990 } },
        tokens: { monthly: 200000, rollover: true },
        features: [
          { name: '所有Starter功能', included: true },
          { name: '200只自选股', included: true },
          { name: '50个价格预警', included: true },
          { name: '无限AI分析', included: true },
          { name: '自定义技术指标', included: true },
          { name: '组合分析', included: true },
          { name: '风险评估', included: true },
          { name: 'API访问 (1000次/天)', included: true },
          { name: '数据导出 (Excel/PDF)', included: true },
          { name: '180天历史数据', included: true },
          { name: '优先邮件支持', included: true }
        ],
        limits: { apiCallsPerDay: 1000, apiCallsPerMonth: 30000, concurrentRequests: 20 },
        trialDays: 14, priority: 3, order: 3
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        description: '企业版，面向机构投资者和基金公司',
        pricing: { monthly: { amount: 999 }, yearly: { amount: 9990 } },
        tokens: { monthly: Infinity, rollover: true },
        features: [
          { name: '所有Pro功能', included: true },
          { name: '无限自选股', included: true },
          { name: '无限预警', included: true },
          { name: '无限AI分析 + 自定义模型', included: true },
          { name: 'API访问 (无限制)', included: true },
          { name: '私有化部署', included: true },
          { name: 'SLA保证 99.9%', included: true },
          { name: '全部历史数据', included: true },
          { name: '专属客户经理', included: true },
          { name: '自定义报告模板', included: true },
          { name: '多账户管理', included: true }
        ],
        limits: { apiCallsPerDay: Infinity, apiCallsPerMonth: Infinity, concurrentRequests: 100, maxTeamSize: Infinity },
        trialDays: 30, priority: 4, order: 4
      }
    ];

    await SubscriptionPlan.insertMany(plans);
  }

  async getPlans() {
    return SubscriptionPlan.find({ isActive: true }).sort({ order: 1 });
  }

  async getPlanBySlug(slug) {
    const plan = await SubscriptionPlan.findOne({ slug, isActive: true });
    if (!plan) throw new Error('订阅计划不存在');
    return plan;
  }

  // 订阅时的功能配置映射
  getFeatureConfig(planSlug) {
    const configs = {
      free: {
        maxWatchlist: 20, maxAlerts: 5, aiAnalysisPerDay: 3,
        realtimeData: false, advancedChart: false, portfolioAnalysis: false,
        apiAccess: false, prioritySupport: false, customIndicators: false,
        exportData: false, historicalData: 90
      },
      starter: {
        maxWatchlist: 50, maxAlerts: 20, aiAnalysisPerDay: 20,
        realtimeData: true, advancedChart: true, portfolioAnalysis: false,
        apiAccess: false, prioritySupport: false, customIndicators: false,
        exportData: false, historicalData: 180
      },
      pro: {
        maxWatchlist: 200, maxAlerts: 50, aiAnalysisPerDay: Infinity,
        realtimeData: true, advancedChart: true, portfolioAnalysis: true,
        apiAccess: true, prioritySupport: true, customIndicators: true,
        exportData: true, historicalData: 365
      },
      enterprise: {
        maxWatchlist: Infinity, maxAlerts: Infinity, aiAnalysisPerDay: Infinity,
        realtimeData: true, advancedChart: true, portfolioAnalysis: true,
        apiAccess: true, prioritySupport: true, customIndicators: true,
        exportData: true, historicalData: Infinity
      }
    };
    return configs[planSlug] || configs.free;
  }

  // 创建/升级订阅
  async createSubscription(userId, planSlug, period = 'monthly') {
    const user = await User.findById(userId);
    if (!user) throw new Error('用户不存在');

    const plan = await this.getPlanBySlug(planSlug);
    const price = plan.pricing[period];

    if (!price || price.amount === 0) {
      // 免费计划
      user.subscription.plan = plan.slug;
      user.subscription.status = 'active';
      user.subscription.features = this.getFeatureConfig(plan.slug);
      user.tokenBalance = plan.tokens.monthly === Infinity ? 999999999 : plan.tokens.monthly;
      user.monthlyTokensUsed = 0;
      user.lastBillingDate = new Date();
      await user.save();
      return { user, message: '订阅激活成功' };
    }

    // 付费计划 (实际需要Stripe集成)
    user.subscription.plan = plan.slug;
    user.subscription.status = 'active';
    user.subscription.features = this.getFeatureConfig(plan.slug);
    user.tokenBalance = plan.tokens.monthly === Infinity ? 999999999 : plan.tokens.monthly;
    user.monthlyTokensUsed = 0;
    user.lastBillingDate = new Date();
    await user.save();

    return { user, message: '订阅创建成功', plan: plan.name };
  }

  // 取消订阅
  async cancelSubscription(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('用户不存在');
    if (user.subscription.plan === 'free') throw new Error('免费计划无法取消');

    user.subscription.status = 'cancelled';
    await user.save();
    return { message: '订阅已取消，将在当前计费周期结束后降级为免费计划' };
  }

  // 检查订阅状态
  async checkSubscriptionStatus(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('用户不存在');
    return {
      plan: user.subscription.plan,
      status: user.subscription.status,
      tokenBalance: user.tokenBalance,
      monthlyTokensUsed: user.monthlyTokensUsed,
      features: user.subscription.features
    };
  }
}

module.exports = new SubscriptionService();
