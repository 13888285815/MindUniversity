require('dotenv').config();

// 生产环境安全校验
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`\n  ❌ 缺少必需的环境变量: ${missing.join(', ')}`);
    console.error('  请检查 .env 文件或系统环境变量配置\n');
    process.exit(1);
  }

  // 检查弱密钥
  const weakSecrets = ['change-this', 'change_this', 'your_jwt', 'admin123', 'secret-key', 'test_key'];
  const jwtSecret = process.env.JWT_SECRET || '';
  if (jwtSecret.length < 32 || weakSecrets.some(w => jwtSecret.toLowerCase().includes(w))) {
    console.error('\n  ❌ JWT_SECRET 不安全！请使用至少64字符的强随机密钥');
    console.error('  生成命令: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.error('');
    process.exit(1);
  }

  // 检查 CORS 配置
  const corsOrigin = process.env.CORS_ORIGIN || '';
  if (corsOrigin === '*' || corsOrigin === '') {
    console.error('\n  ❌ 生产环境禁止 CORS_ORIGIN=*，请配置具体的允许域名');
    process.exit(1);
  }
}

const app = require('./server/app');
const subscriptionService = require('./server/services/subscriptionService');
const marketDataService = require('./server/services/marketDataService');

const PORT = process.env.PORT || 3000;

// 启动服务器
const server = app.listen(PORT, async () => {
  console.log(`\n  ╔══════════════════════════════════════════════╗`);
  console.log(`  ║   智慧证券分析平台 v2.0                      ║`);
  console.log(`  ║   Smart Stock Analysis Platform              ║`);
  console.log(`  ╠══════════════════════════════════════════════╣`);
  console.log(`  ║   Server: http://localhost:${PORT}             ║`);
  console.log(`  ║   Env: ${process.env.NODE_ENV || 'development'}                          ║`);
  console.log(`  ╚══════════════════════════════════════════════╝\n`);

  // 初始化订阅计划
  try {
    await subscriptionService.initializePlans();
    console.log('  ✅ 订阅计划已初始化');
  } catch (error) {
    console.error('  ❌ 订阅计划初始化失败:', error.message);
  }

  // 启动行情数据推送
  try {
    marketDataService.startRealTimeFeed();
    console.log('  ✅ 实时行情数据服务已启动');
  } catch (error) {
    console.error('  ❌ 行情数据服务启动失败:', error.message);
  }
});

// Socket.io 实时推送 - 安全的CORS配置
const ioConfig = {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
};

if (process.env.NODE_ENV === 'production' && process.env.CORS_ORIGIN) {
  ioConfig.cors.origin = process.env.CORS_ORIGIN.split(',').map(s => s.trim());
}

const io = require('socket.io')(server, ioConfig);

io.on('connection', (socket) => {
  console.log(`  🔗 客户端连接: ${socket.id}`);

  socket.on('subscribe:stock', (symbol) => {
    socket.join(`stock:${symbol}`);
    console.log(`  📈 客户端 ${socket.id} 订阅: ${symbol}`);
  });

  socket.on('unsubscribe:stock', (symbol) => {
    socket.leave(`stock:${symbol}`);
  });

  socket.on('disconnect', () => {
    console.log(`  🔌 客户端断开: ${socket.id}`);
  });
});

// 将 io 实例挂载到 app
app.set('io', io);

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('\n  SIGTERM: 正在关闭服务器...');
  io.close();
  server.close();
  const database = require('./server/config/database');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n  SIGINT: 正在关闭服务器...');
  io.close();
  server.close();
  const database = require('./server/config/database');
  await database.disconnect();
  process.exit(0);
});

module.exports = { server, io };
