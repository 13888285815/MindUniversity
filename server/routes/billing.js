const express = require('express');
const router = express.Router();
const billingService = require('../services/billingService');
const { authenticateJWT, authenticateAPIKey, requireTokenBalance, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// 获取用户余额
router.get('/balance', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        balance: user.tokenBalance,
        totalUsed: user.totalTokensUsed,
        monthlyUsed: user.monthlyTokensUsed,
        lastBillingDate: user.lastBillingDate
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取使用量统计
router.get('/usage', authenticateJWT, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const stats = await billingService.getUserUsageStats(req.userId, parseInt(days));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// 获取每日使用量
router.get('/usage/daily', authenticateJWT, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const dailyStats = await billingService.getDailyUsage(req.userId, parseInt(days));

    res.json({
      success: true,
      data: {
        daily: dailyStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取账单列表
router.get('/invoices', authenticateJWT, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await billingService.getUserInvoices(
      req.userId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 获取账单详情
router.get('/invoices/:id', authenticateJWT, async (req, res, next) => {
  try {
    const { id } = req.params;
    const Invoice = require('../models').Invoice;

    const invoice = await Invoice.findOne({ _id: id, user: req.userId });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: '账单不存在'
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    next(error);
  }
});

// 生成使用量发票
router.post('/invoices/generate', authenticateJWT, async (req, res, next) => {
  try {
    const invoice = await billingService.generateUsageInvoice(req.userId);

    res.status(201).json({
      success: true,
      message: '发票生成成功',
      data: { invoice }
    });
  } catch (error) {
    next(error);
  }
});

// API路由 (需要API Key认证)

// 获取API使用量 (API Key方式)
router.get('/api/usage', authenticateAPIKey, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const stats = await billingService.getUserUsageStats(req.userId, parseInt(days));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// 获取API余额 (API Key方式)
router.get('/api/balance', authenticateAPIKey, async (req, res, next) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        balance: user.tokenBalance,
        plan: user.subscription.plan
      }
    });
  } catch (error) {
    next(error);
  }
});

// 管理员路由 - 获取系统统计 (需要管理员角色)
router.get('/admin/stats',
  authenticateJWT,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const stats = await billingService.getSystemStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
