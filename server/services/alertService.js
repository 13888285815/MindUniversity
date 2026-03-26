const { Alert } = require('../models');
const marketDataService = require('./marketDataService');

class AlertService {
  // 创建预警
  async createAlert(userId, alertData) {
    const { stock, symbol, market, name, condition, note, notifications, expiresAt } = alertData;

    // 检查用户预警数量限制
    const User = require('../models').User;
    const user = await User.findById(userId);
    const planLimits = { free: 5, starter: 20, pro: 50, enterprise: 200 };
    const limit = planLimits[user?.subscription?.plan] || planLimits.free;

    const activeAlerts = await Alert.countDocuments({ user: userId, status: 'active' });
    if (activeAlerts >= limit) {
      throw new Error(`当前计划最多创建 ${limit} 个预警，请升级订阅`);
    }

    return Alert.create({
      user: userId,
      stock,
      symbol,
      market,
      name,
      condition,
      note,
      notifications: notifications || { inApp: true, email: false, push: false },
      expiresAt
    });
  }

  // 获取用户预警列表
  async getAlerts(userId, { status = 'active', page = 1, limit = 20 } = {}) {
    const query = { user: userId };
    if (status && status !== 'all') query.status = status;

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .populate('stock', 'symbol name market quote')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Alert.countDocuments(query)
    ]);

    return {
      alerts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    };
  }

  // 删除预警
  async deleteAlert(userId, alertId) {
    const alert = await Alert.findOne({ _id: alertId, user: userId });
    if (!alert) throw new Error('预警不存在');
    alert.status = 'cancelled';
    await alert.save();
  }

  // 暂停/恢复预警
  async toggleAlert(userId, alertId) {
    const alert = await Alert.findOne({ _id: alertId, user: userId });
    if (!alert) throw new Error('预警不存在');
    
    if (alert.status === 'active') {
      alert.status = 'cancelled';
    } else {
      alert.status = 'active';
    }
    await alert.save();
    return alert;
  }

  // 检查所有活跃预警 (定时任务调用)
  async checkAllAlerts() {
    const activeAlerts = await Alert.find({
      status: 'active',
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    });

    let triggeredCount = 0;
    for (const alert of activeAlerts) {
      try {
        const quote = await marketDataService.getRealtimeQuote(alert.symbol, alert.market);
        const triggered = await Alert.checkAlerts(alert.symbol, alert.market, quote);
        triggeredCount += triggered.length;
      } catch (error) {
        console.error(`检查预警失败 ${alert.symbol}:`, error.message);
      }
    }

    return triggeredCount;
  }
}

module.exports = new AlertService();
