const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const database = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { basicLimiter } = require('./middleware/rateLimiter');

// 路由导入
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const billingRoutes = require('./routes/billing');
const stockRoutes = require('./routes/stocks');
const marketRoutes = require('./routes/market');
const aiRoutes = require('./routes/ai');
const alertRoutes = require('./routes/alerts');
const customerServiceRoutes = require('./routes/customerService');

const app = express();

// 安全中间件 - Helmet 增强配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  // Permissions-Policy: restrict browser features
  permissionsPolicy: {
    features: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      speaker: [],
      vibrate: []
    }
  }
}));

// CORS - 严格化配置
const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

if (process.env.NODE_ENV === 'production') {
  const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  corsOptions.origin = function(origin, callback) {
    // 允许无 origin 的请求（如服务端调用）
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] 被拒绝的来源: ${origin}`);
      callback(new Error('不允许的CORS来源'));
    }
  };
} else {
  // 开发环境仅允许 localhost
  corsOptions.origin = function(origin, callback) {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] 开发环境被拒绝的来源: ${origin}`);
      callback(new Error('不允许的CORS来源'));
    }
  };
}

app.use(cors(corsOptions));
app.use(compression());

// 日志
app.use(morgan('combined'));

// 解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 静态文件 - 安全配置
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  setHeaders: (res, path) => {
    // 禁止HTML文件在uploads目录中执行
    if (path.endsWith('.html') || path.endsWith('.htm')) {
      res.setHeader('Content-Disposition', 'attachment');
    }
    // 设置安全的缓存头
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));
app.use(express.static('public'));

// 限流
app.use(basicLimiter);

// 路由
app.use('/', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/customer-service', customerServiceRoutes);

// API 信息
app.get('/api', (req, res) => {
  res.json({
    name: '智慧证券分析平台 API',
    version: '2.0.0',
    description: '集成银河证券智慧星/同花顺行情 + 订阅体系 + AI API Token计费',
    endpoints: {
      auth: '/api/auth',
      stocks: '/api/stocks',
      market: '/api/market',
      ai: '/api/ai',
      alerts: '/api/alerts',
      subscription: '/api/subscription',
      billing: '/api/billing',
      aiApi: '/api/ai/v1/*'
    },
    documentation: 'https://github.com/13888285815/stock'
  });
});

// 404
app.use(notFound);

// 错误处理
app.use(errorHandler);

// 数据库 - 在 Vercel serverless 环境中由 api/index.js 按需连接
if (!process.env.VERCEL) {
  database.connectMongoDB();
  database.connectRedis();
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM: 正在关闭...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT: 正在关闭...');
  await database.disconnect();
  process.exit(0);
});

module.exports = app;
