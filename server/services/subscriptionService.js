const { User, SubscriptionPlan } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class SubscriptionService {
  // 初始化订阅计划
  async initializePlans() {
    const existingPlans = await SubscriptionPlan.countDocuments();

    if (existingPlans > 0) {
      console.log('订阅计划已存在');
      return;
    }

    const plans = [
      {
        name: 'Free',
        slug: 'free',
        description: '免费计划，适合个人学习和基础使用',
        pricing: {
          monthly: { amount: 0, currency: 'CNY' },
          yearly: { amount: 0, currency: 'CNY' }
        },
        tokens: {
          monthly: 50000,
          rollover: false
        },
        features: [
          { name: '每月50,000 Tokens', included: true },
          { name: '访问基础课程', included: true },
          { name: '标准API响应速度', included: true },
          { name: '社区支持', included: true },
          { name: '优先API响应', included: false },
          { name: '高级分析', included: false },
          { name: 'API优先支持', included: false }
        ],
        limits: {
          apiCallsPerDay: 100,
          apiCallsPerMonth: 3000,
          concurrentRequests: 3
        },
        trialDays: 0,
        priority: 1,
        order: 1
      },
      {
        name: 'Pro',
        slug: 'pro',
        description: '专业计划，适合开发者和专业用户',
        pricing: {
          monthly: { amount: 199, currency: 'CNY' },
          yearly: { amount: 1990, currency: 'CNY' }
        },
        tokens: {
          monthly: 500000,
          rollover: true
        },
        features: [
          { name: '每月500,000 Tokens', included: true },
          { name: '访问所有课程', included: true },
          { name: '优先API响应', included: true },
          { name: '邮件支持', included: true },
          { name: '高级分析', included: true },
          { name: 'API优先支持', included: true },
          { name: '优先技术支持', included: false }
        ],
        limits: {
          apiCallsPerDay: 1000,
          apiCallsPerMonth: 30000,
          concurrentRequests: 10
        },
        trialDays: 7,
        priority: 2,
        isRecommended: true,
        order: 2
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        description: '企业计划，适合团队和企业级应用',
        pricing: {
          monthly: { amount: 999, currency: 'CNY' },
          yearly: { amount: 9990, currency: 'CNY' }
        },
        tokens: {
          monthly: Infinity,
          rollover: true
        },
        features: [
          { name: '无限Tokens', included: true },
          { name: '访问所有课程', included: true },
          { name: '优先API响应', included: true },
          { name: '专属客户经理', included: true },
          { name: '高级分析', included: true },
          { name: 'API优先支持', included: true },
          { name: '定制化解决方案', included: true },
          { name: 'SLA保证', included: true },
          { name: '私有化部署', included: true }
        },
        limits: {
          apiCallsPerDay: Infinity,
          apiCallsPerMonth: Infinity,
          concurrentRequests: 50,
          maxTeamSize: Infinity,
          customModels: true
        },
        trialDays: 14,
        priority: 3,
        order: 3
      }
    ];

    await SubscriptionPlan.insertMany(plans);
    console.log('订阅计划初始化完成');
  }

  // 获取所有订阅计划
  async getPlans() {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1 });
    return plans;
  }

  // 获取单个订阅计划
  async getPlanBySlug(slug) {
    const plan = await SubscriptionPlan.findOne({ slug, isActive: true });
    if (!plan) {
      throw new Error('订阅计划不存在');
    }
    return plan;
  }

  // 创建Stripe客户
  async createStripeCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: user._id.toString()
        }
      });

      return customer;
    } catch (error) {
      console.error('创建Stripe客户失败:', error);
      throw new Error('创建支付账户失败');
    }
  }

  // 创建订阅
  async createSubscription(userId, planSlug, period = 'monthly') {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const plan = await this.getPlanBySlug(planSlug);
    const price = plan.pricing[period];

    if (!price || price.amount === 0) {
      // 免费计划直接激活
      user.subscription.plan = plan.slug;
      user.subscription.status = 'active';
      user.tokenBalance = plan.tokens.monthly;
      user.monthlyTokensUsed = 0;
      user.lastBillingDate = new Date();
      await user.save();

      return {
        user,
        subscription: user.subscription
      };
    }

    // 付费计划需要Stripe
    try {
      // 创建或获取Stripe客户
      let stripeCustomerId = user.subscription.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await this.createStripeCustomer(user);
        stripeCustomerId = customer.id;
      }

      // 这里应该创建Stripe订阅
      // 实际实现需要配置Stripe价格ID
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price: plan.stripePriceId[period]
          }
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // 更新用户订阅
      user.subscription.plan = plan.slug;
      user.subscription.status = 'active';
      user.subscription.stripeCustomerId = stripeCustomerId;
      user.subscription.stripeSubscriptionId = subscription.id;
      user.tokenBalance = plan.tokens.monthly;
      user.monthlyTokensUsed = 0;
      user.lastBillingDate = new Date();

      await user.save();

      return {
        user,
        subscription: user.subscription,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      };

    } catch (error) {
      console.error('创建订阅失败:', error);
      throw new Error('创建订阅失败: ' + error.message);
    }
  }

  // 升级订阅
  async upgradeSubscription(userId, targetPlanSlug) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const currentPlanSlug = user.subscription.plan;
    const targetPlan = await this.getPlanBySlug(targetPlanSlug);

    // 检查是否真的需要升级
    const planPriority = { free: 1, pro: 2, enterprise: 3 };
    if (planPriority[targetPlanSlug] <= planPriority[currentPlanSlug]) {
      throw new Error('只能升级到更高级的计划');
    }

    // 更新订阅
    user.subscription.plan = targetPlanSlug;
    user.tokenBalance = targetPlan.tokens.monthly;

    await user.save();

    return {
      user,
      message: '订阅升级成功'
    };
  }

  // 取消订阅
  async cancelSubscription(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.subscription.plan === 'free') {
      throw new Error('免费计划无法取消');
    }

    try {
      // 取消Stripe订阅
      if (user.subscription.stripeSubscriptionId) {
        await stripe.subscriptions.update(
          user.subscription.stripeSubscriptionId,
          { cancel_at_period_end: true }
        );
      }

      // 标记为已取消
      user.subscription.status = 'cancelled';
      await user.save();

      return {
        user,
        message: '订阅已取消，将在当前计费周期结束后生效'
      };

    } catch (error) {
      console.error('取消订阅失败:', error);
      throw new Error('取消订阅失败');
    }
  }

  // 检查订阅状态
  async checkSubscriptionStatus(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 如果有Stripe订阅，检查状态
    if (user.subscription.stripeSubscriptionId && user.subscription.status === 'active') {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );

        if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
          user.subscription.status = 'cancelled';
          await user.save();
        }
      } catch (error) {
        console.error('检查订阅状态失败:', error);
      }
    }

    return {
      plan: user.subscription.plan,
      status: user.subscription.status,
      tokenBalance: user.tokenBalance,
      monthlyTokensUsed: user.monthlyTokensUsed
    };
  }

  // 处理Stripe Webhook
  async handleStripeWebhook(event) {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`未处理的事件类型: ${event.type}`);
    }
  }

  // 处理订阅更新
  async handleSubscriptionUpdate(subscription) {
    const userId = subscription.metadata.userId;

    await User.updateOne(
      { 'subscription.stripeSubscriptionId': subscription.id },
      {
        $set: {
          'subscription.status': subscription.status === 'active' ? 'active' : 'inactive',
          'subscription.endDate': new Date(subscription.current_period_end * 1000)
        }
      }
    );
  }

  // 处理支付成功
  async handlePaymentSuccess(invoice) {
    const customerId = invoice.customer;
    const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });

    if (!user) return;

    // 生成发票记录
    // 这里应该创建发票到数据库

    console.log(`用户 ${user.email} 支付成功: ${invoice.amount_paid / 100} ${invoice.currency}`);
  }

  // 处理支付失败
  async handlePaymentFailed(invoice) {
    const customerId = invoice.customer;
    const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });

    if (!user) return;

    user.subscription.status = 'past_due';
    await user.save();

    console.log(`用户 ${user.email} 支付失败`);
  }

  // 处理订阅删除
  async handleSubscriptionDeleted(subscription) {
    await User.updateOne(
      { 'subscription.stripeSubscriptionId': subscription.id },
      {
        $set: {
          'subscription.status': 'cancelled',
          'subscription.plan': 'free'
        }
      }
    );
  }
}

module.exports = new SubscriptionService();
