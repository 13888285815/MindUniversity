const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT认证中间件
const authenticateJWT = async (req, res, next) => {
  try {
    // 从header获取token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // 将用户信息附加到请求对象
    req.user = user;
    req.userId = user._id;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的令牌'
      });
    }

    res.status(500).json({
      success: false,
      message: '认证失败',
      error: error.message
    });
  }
};

// 检查用户角色
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

// 检查订阅计划
const requireSubscription = (...plans) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证'
      });
    }

    // 检查订阅状态
    if (!plans.includes(req.user.subscription.plan)) {
      return res.status(403).json({
        success: false,
        message: '此功能需要升级订阅计划',
        currentPlan: req.user.subscription.plan,
        requiredPlan: plans[0]
      });
    }

    // 检查订阅是否有效
    if (req.user.subscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '订阅已过期，请续费',
        status: req.user.subscription.status
      });
    }

    next();
  };
};

// 检查Token余额
const requireTokenBalance = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  // 检查Token余额
  if (req.user.tokenBalance <= 0) {
    return res.status(402).json({
      success: false,
      message: 'Token余额不足，请充值或升级订阅',
      currentBalance: req.user.tokenBalance
    });
  }

  next();
};

// API Key认证
const authenticateAPIKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少API Key'
      });
    }

    const apiKey = authHeader.replace('Bearer ', '');

    // 查找用户
    const user = await User.findOne({
      'apiKeys.keyHash': apiKey,
      'apiKeys.isActive': true,
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '无效的API Key'
      });
    }

    // 查找具体的API Key
    const apiKeyData = user.apiKeys.find(
      k => k.keyHash === apiKey && k.isActive
    );

    if (!apiKeyData) {
      return res.status(401).json({
        success: false,
        message: 'API Key已失效'
      });
    }

    // 检查订阅状态
    if (user.subscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '订阅已过期'
      });
    }

    // 附加信息到请求
    req.user = user;
    req.userId = user._id;
    req.apiKey = apiKey;
    req.apiKeyId = apiKeyData.keyId;

    next();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API认证失败',
      error: error.message
    });
  }
};

module.exports = {
  authenticateJWT,
  requireRole,
  requireSubscription,
  requireTokenBalance,
  authenticateAPIKey
};
