const { User, APILog, Invoice, SubscriptionPlan } = require('../models');
const crypto = require('crypto');

class BillingService {
  // 计算API调用成本
  async calculateAPIUsage(model, inputTokens, outputTokens) {
    // 模型定价 (每1000 tokens的美元价格)
    const modelPricing = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-32k': { input: 0.06, output: 0.12 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'text-embedding-ada-002': { input: 0.0001, output: 0 },
    };

    const pricing = modelPricing[model] || modelPricing['gpt-3.5-turbo'];

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;

    // 转换为人民币 (假设汇率为 7)
    const cnyCost = totalCost * 7;

    // 转换为Tokens (简化计算，实际应该按模型和用量)
    const tokensUsed = inputTokens + outputTokens;

    return {
      tokensUsed,
      costUSD: totalCost,
      costCNY: cnyCost,
      breakdown: {
        inputTokens,
        outputTokens,
        inputCost,
        outputCost
      }
    };
  }

  // 记录API调用
  async logAPIRequest(logData) {
    const log = await APILog.create(logData);
    return log;
  }

  // 扣除用户Token
  async deductUserTokens(userId, tokens) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查余额
    if (user.tokenBalance < tokens) {
      throw new Error('Token余额不足');
    }

    // 扣除Token
    user.tokenBalance -= tokens;
    user.totalTokensUsed += tokens;
    user.monthlyTokensUsed += tokens;

    await user.save();

    // 检查是否需要发送余额预警
    await this.checkBalanceAlert(user);

    return user;
  }

  // 检查余额预警
  async checkBalanceAlert(user) {
    const plans = {
      free: 50000,
      pro: 500000,
      enterprise: Infinity
    };

    const limit = plans[user.subscription.plan] || plans.free;
    const remainingPercentage = (user.tokenBalance / limit) * 100;

    // 当余额低于20%时发送预警
    if (remainingPercentage < 20 && remainingPercentage > 10) {
      // 这里应该发送邮件或通知
      console.log(`用户 ${user.email} 的Token余额低于20%`);
    }

    // 当余额低于10%时发送紧急预警
    if (remainingPercentage < 10) {
      console.log(`用户 ${user.email} 的Token余额低于10%，即将耗尽`);
    }
  }

  // 获取用户使用统计
  async getUserUsageStats(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await APILog.getUserTokenUsage(userId, startDate, new Date());

    return {
      ...stats,
      period: {
        start: startDate,
        end: new Date(),
        days
      }
    };
  }

  // 获取每日使用量
  async getDailyUsage(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyStats = await APILog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalTokens: { $sum: '$tokenUsage.totalTokens' },
          requestCount: { $sum: 1 },
          avgResponseTime: { $avg: '$response.responseTime' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return dailyStats.map(stat => ({
      date: stat._id,
      tokens: stat.totalTokens,
      requests: stat.requestCount,
      avgResponseTime: stat.avgResponseTime
    }));
  }

  // 创建发票
  async createInvoice(invoiceData) {
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    return invoice;
  }

  // 生成使用量发票
  async generateUsageInvoice(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取本月使用量
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const usage = await APILog.getUserTokenUsage(userId, firstDay, now);

    if (usage.totalTokens === 0) {
      throw new Error('本月无使用量');
    }

    // 计算费用
    const cost = await this.calculateAPIUsage('gpt-3.5-turbo', usage.promptTokens, usage.completionTokens);

    // 创建发票
    const invoice = await this.createInvoice({
      user: userId,
      type: 'usage',
      status: 'pending',
      subtotal: cost.costCNY,
      total: cost.costCNY,
      items: [{
        description: `AI API使用量 (${usage.totalTokens} tokens)`,
        quantity: 1,
        unitPrice: cost.costCNY,
        amount: cost.costCNY
      }],
      usage: {
        tokensUsed: usage.totalTokens,
        billingPeriod: {
          start: firstDay,
          end: now
        }
      },
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30天后到期
    });

    return invoice;
  }

  // 获取用户账单列表
  async getUserInvoices(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const invoices = await Invoice.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments({ user: userId });

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 获取系统统计
  async getSystemStats() {
    const stats = await APILog.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: '$tokenUsage.totalTokens' },
          avgResponseTime: { $avg: '$response.responseTime' },
          errorCount: {
            $sum: {
              $cond: [{ $ne: ['$error.message', null] }, 1, 0]
            }
          }
        }
      }
    ]);

    const popularEndpoints = await APILog.getPopularEndpoints(10);
    const errorRate = await APILog.getErrorRate(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      new Date()
    );

    return {
      ...(stats[0] || {
        totalRequests: 0,
        totalTokens: 0,
        avgResponseTime: 0,
        errorCount: 0
      }),
      popularEndpoints,
      errorRate
    };
  }

  // 重置每月使用量
  async resetMonthlyUsage() {
    // 每月1号执行
    const now = new Date();
    if (now.getDate() !== 1) return;

    // 重置所有用户的每月使用量
    await User.updateMany({}, {
      $set: {
        monthlyTokensUsed: 0
      }
    });

    console.log('每月使用量已重置');
  }
}

module.exports = new BillingService();
