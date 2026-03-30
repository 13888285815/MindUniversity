# Mind University - 意念大学网

专业的在线学习平台，提供编程、设计、AI等领域的高质量视频教程。

## ✨ 特性

### 核心功能
- 📚 **丰富的课程库** - 涵盖10大分类，28+课程
- 🎓 **分层订阅体系** - Free/Starter/Pro/Enterprise 四种订阅计划
- 🤖 **AI API计费** - 精确的API Token配额管理和成本追踪
- 🌍 **多语言支持** - 中文、英文、法文、德文、日文、阿拉伯文
- 📱 **完美响应式** - 支持iOS、Android、鸿蒙、平板、桌面端
- 🔒 **安全加固** - 防XSS、CSRF、SQL注入、CORS保护

### 订阅计划
| 计划 | 价格 | 月Token配额 | 日API调用 | 支持等级 |
|------|------|-----------|----------|----------|
| Free | ¥0 | 50K | 100 | 社区 |
| Starter | ¥99 | 500K | 500 | 邮件 |
| Pro | ¥299 | 2M | 2,000 | 优先 |
| Enterprise | ¥999 | 无限 | 无限 | 专属 |

## 🚀 快速开始

### 环境要求
- Node.js >= 20
- MongoDB Atlas 连接
- Redis (可选)

### 本地开发
```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动开发服务器
npm run dev

# 前端开发 (Vite)
cd client && npm run dev
```

### 环境变量
```env
# Server
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret-key

# Database
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://localhost:6379

# Payment
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
ALIPAY_APP_ID=...
WECHAT_APP_ID=...

# AI API (Optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Vercel
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

## 📦 项目结构

```
minduniversity/
├── public/                 # 静态文件
│   ├── index.html         # 主页
│   └── 51zxw-clone.html  # 完整仿制版
├── client/               # 前端 (Vue.js + Vite)
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── views/        # 页面
│   │   ├── store/        # Vuex/Pinia
│   │   └── router/       # Vue Router
│   └── package.json
├── server/              # 后端
│   ├── routes/          # 路由
│   │   ├── auth.js      # 认证
│   │   ├── subscription.js  # 订阅系统
│   │   └── api.js       # AI API代理
│   ├── middleware/      # 中间件
│   │   └── security.js  # 安全套件
│   ├── models/          # 数据模型
│   ├── services/        # 业务逻辑
│   └── config/         # 配置
├── docs/              # 文档
├── .github/           # GitHub Actions
│   └── workflows/
└── vercel.json        # Vercel配置
```

## 🔒 安全特性

- ✅ CSP (Content Security Policy)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ XSS 过滤
- ✅ CSRF Token 验证
- ✅ SQL 注入防护
- ✅ CORS 配置
- ✅ Rate Limiting (速率限制)
- ✅ JWT 认证
- ✅ 密码加密 (bcrypt)
- ✅ Input Sanitization

## 🌐 多语言

支持以下语言：
- 🇨🇳 中文 (zh-CN)
- 🇺🇸 English (en)
- 🇫🇷 Français (fr)
- 🇩🇪 Deutsch (de)
- 🇯🇵 日本語 (ja)
- 🇸🇦 العربية (ar)

切换语言：
```javascript
setLang('en'); // 切换到英文
```

## 📊 API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新Token

### 订阅
- `GET /api/subscription/plans` - 获取订阅计划
- `GET /api/subscription/current` - 当前订阅
- `POST /api/subscription/subscribe` - 订阅计划
- `POST /api/subscription/cancel` - 取消订阅
- `GET /api/subscription/usage` - 使用统计
- `GET /api/subscription/invoices` - 账单列表

### AI API
- `POST /api/v1/chat/completions` - 聊天完成
- `POST /api/v1/embeddings` - 文本嵌入
- `GET /api/v1/models` - 模型列表

## 🚢 部署

### GitHub Actions 自动部署
推送到 `main` 分支自动触发部署：
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### 手动部署到 Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 📝 开发指南

### 添加新语言
1. 在 `translations` 对象中添加语言键
2. 添加语言选择器选项
3. 更新文档

### 添加订阅计划
```javascript
const newPlan = {
  name: 'Premium',
  displayName: { zh: '高级版', en: 'Premium' },
  price: 499,
  apiTokensPerMonth: 5000000,
  // ...
};
await SubscriptionPlan.create(newPlan);
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

Copyright © 2026 意念大学网 (Mind University)
蜀ICP备12020098号

## 🔗 相关链接

- [GitHub仓库](https://github.com/13888285815/MindUniversity)
- [Vercel部署](https://minduniversity.vercel.app)
- [文档中心](https://docs.minduniversity.com)

## 📞 联系方式

- 邮箱: support@minduniversity.com
- 微信: MindUniversity
- 客服: https://minduniversity.com/support
