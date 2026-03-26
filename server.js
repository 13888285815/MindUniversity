require('dotenv').config();
const app = require('./server/app');
const subscriptionService = require('./server/services/subscriptionService');

const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);

  // 初始化订阅计划
  try {
    await subscriptionService.initializePlans();
    console.log('✅ Subscription plans initialized');
  } catch (error) {
    console.error('❌ Failed to initialize subscription plans:', error.message);
  }
});
