const rateLimit = require('express-rate-limit');

// 基本限流器
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API请求限流器 (更严格)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 60, // 最多60个请求
  message: {
    success: false,
    message: 'API请求过于频繁，请降低请求频率'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 登录限流器 (防止暴力破解)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次登录尝试（无论成功失败）
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: '登录尝试过多，账户已临时锁定，请15分钟后再试'
  },
  handler: (req, res) => {
    // 记录可疑的暴力破解尝试（不记录邮箱等敏感信息）
    console.warn(`[安全警告] 登录限流触发 IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: '登录尝试过多，账户已临时锁定，请15分钟后再试'
    });
  }
});

// 注册限流器
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册尝试
  message: {
    success: false,
    message: '注册尝试过多，请1小时后再试'
  }
});

// 创建用户限流器 (基于用户ID)
const createUserLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => req.userId?.toString() || req.ip,
    message: {
      success: false,
      message: '您的请求过于频繁'
    }
  });
};

module.exports = {
  basicLimiter,
  apiLimiter,
  authLimiter,
  registerLimiter,
  createUserLimiter
};
