const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { authenticateJWT, requireSubscription } = require('../middleware/auth');

// 获取所有订阅计划
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await subscriptionService.getPlans();

    res.json({
      success: true,
      data: {
        plans
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取单个订阅计划
router.get('/plans/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const plan = await subscriptionService.getPlanBySlug(slug);

    res.json({
      success: true,
      data: {
        plan
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取当前订阅状态
router.get('/status', authenticateJWT, async (req, res, next) => {
  try {
    const status = await subscriptionService.checkSubscriptionStatus(req.userId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

// 创建/升级订阅
router.post('/create', authenticateJWT, async (req, res, next) => {
  try {
    const { plan, period } = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: '请指定订阅计划'
      });
    }

    const result = await subscriptionService.createSubscription(req.userId, plan, period);

    res.status(201).json({
      success: true,
      message: '订阅创建成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 升级订阅
router.post('/upgrade', authenticateJWT, async (req, res, next) => {
  try {
    const { targetPlan } = req.body;

    if (!targetPlan) {
      return res.status(400).json({
        success: false,
        message: '请指定目标计划'
      });
    }

    const result = await subscriptionService.upgradeSubscription(req.userId, targetPlan);

    res.json({
      success: true,
      message: result.message,
      data: {
        user: result.user
      }
    });
  } catch (error) {
    next(error);
  }
});

// 取消订阅
router.post('/cancel', authenticateJWT, async (req, res, next) => {
  try {
    const result = await subscriptionService.cancelSubscription(req.userId);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await subscriptionService.handleStripeWebhook(event);

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
