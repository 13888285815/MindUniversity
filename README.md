# 智慧证券分析平台 (Stock Smart Platform)

> 类银河证券智慧星 + 同花顺的智能证券分析平台，集成订阅体系与 AI API Tokens 精确计费系统。

## 功能特性

### 实时行情
- **实时报价推送** — 基于 Socket.io 的毫秒级行情推送
- **K 线图表** — 支持 1m/5m/15m/30m/60m/日/周/月多周期 K 线
- **分时图** — 个股分时走势，叠加均价线
- **五档盘口** — 买一到买五 / 卖一到卖五实时数据
- **大盘指数** — 上证指数、深证成指、创业板指等实时数据
- **板块行情** — 行业板块涨幅排行与资金流向

### 智能分析
- **AI 个股诊断** — 多维度评分（技术面/基本面/风险/情绪），综合评分 0-100
- **技术指标** — MA(5/10/20/60/120/250)、MACD、KDJ、RSI、BOLL 自动计算
- **涨幅/跌幅/成交量** 排行榜
- **个股搜索** — 按代码、名称、拼音首字母快速检索

### 自选股管理
- 添加/移除自选股（订阅等级限制数量）
- 自选股实时行情刷新
- 分组管理

### 预警系统
- 价格上穿/下穿预警
- 涨跌幅预警
- 成交量异动预警
- 实时监控触发通知

### 订阅系统
- **四档分层定价**: Free / Starter / Pro / Enterprise
- 功能权限按等级自动控制
- 邮箱验证注册流程
- Stripe 在线支付集成

### 智能客服
- **AI 驱动**: 基于 AI 的智能对话系统
- **快速回复**: 常见问题秒级回复
- **FAQ 知识库**: 结构化的问题分类浏览
- **24/7 在线**: 全天候自动客服支持

### AI API Tokens 计费
- OpenAI 兼容的 `/v1/chat/completions` 接口
- API Key 认证 + Token 级别余额管理
- 精确的 Token 消耗统计与追踪
- 用量预警 & 详细账单生成

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Vue 3 + Vite + Element Plus + ECharts + Pinia |
| **后端** | Node.js + Express + Socket.io |
| **数据库** | MongoDB (Mongoose) + Redis |
| **认证** | JWT + API Key + 邮箱验证 |
| **支付** | Stripe |
| **AI** | OpenAI 兼容 API |
| **安全** | Helmet + CORS + Rate Limiting + Bcrypt |

## 项目结构

```
stock-smart-platform/
├── client/                     # Vue 3 前端
│   ├── src/
│   │   ├── views/              # 页面视图 (14个)
│   │   │   ├── Dashboard.vue   # 市场仪表盘
│   │   │   ├── Stock.vue       # 个股详情(K线/分时/盘口)
│   │   │   ├── Watchlist.vue   # 自选股管理
│   │   │   ├── AIAnalysis.vue  # AI 智能分析
│   │   │   ├── Alerts.vue      # 预警管理
│   │   │   ├── Subscription.vue# 订阅计划
│   │   │   ├── Billing.vue     # 账单明细
│   │   │   ├── APIKeys.vue     # API Key 管理
│   │   │   ├── Profile.vue     # 个人中心
│   │   │   ├── Login.vue       # 登录
│   │   │   ├── Register.vue    # 注册
│   │   │   ├── VerifyEmail.vue # 邮箱验证
│   │   │   └── Home.vue        # 首页
│   │   ├── router/             # 路由配置
│   │   ├── store/              # Pinia 状态管理
│   │   └── App.vue             # 根组件(暗色主题)
│   └── package.json
├── server/                     # Express 后端
│   ├── models/                 # Mongoose 数据模型
│   │   ├── Stock.js            # 证券数据 (OHLCV + 基本面)
│   │   ├── Kline.js            # K 线时序 + 技术指标
│   │   ├── User.js             # 用户 + 订阅配置
│   │   ├── Watchlist.js        # 自选股
│   │   ├── AIAnalysis.js       # AI 分析记录
│   │   ├── Alert.js            # 价格预警
│   │   ├── SubscriptionPlan.js # 订阅计划
│   │   ├── Invoice.js          # 账单
│   │   └── APILog.js           # API 调用日志
│   ├── routes/                 # API 路由
│   │   ├── stocks.js           # 证券搜索/排行/自选
│   │   ├── market.js           # 行情数据(K线/分时/盘口)
│   │   ├── ai.js               # AI 分析 + OpenAI 兼容接口
│   │   ├── alerts.js           # 预警 CRUD
│   │   ├── auth.js             # 注册/登录/验证
│   │   ├── subscription.js     # 订阅管理
│   │   └── billing.js          # 计费/账单
│   ├── services/               # 业务逻辑层
│   │   ├── marketDataService.js    # 行情数据生成与推送
│   │   ├── stockService.js         # 证券业务逻辑
│   │   ├── aiAnalysisService.js    # AI 分析 + Token 计费
│   │   ├── alertService.js         # 预警业务逻辑
│   │   ├── authService.js          # 认证 + API Key
│   │   ├── subscriptionService.js  # 订阅等级管理
│   │   └── billingService.js       # 计费统计
│   ├── middleware/             # 中间件
│   ├── config/                 # 配置
│   └── app.js                  # Express 应用入口
├── public/                     # 静态资源
├── docs/                       # 文档
├── .env.example                # 环境变量模板
├── package.json
└── server.js                   # 主入口 (Socket.io)
```

## 快速开始

详细安装和运行说明请查看 [QUICK_START.md](./QUICK_START.md)

### 前置要求
- Node.js 18+
- MongoDB 7+
- Redis 7+

### 一键启动

```bash
# 1. 克隆仓库
git clone https://github.com/13888285815/stock.git
cd stock

# 2. 安装依赖
npm install
cd client && npm install && cd ..

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入实际配置

# 4. 启动数据库
brew services start mongodb-community
brew services start redis

# 5. 启动后端 + 前端
npm run dev:all
```

访问:
- 前端: http://localhost:5173
- 后端 API: http://localhost:3000

## API 文档

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/verify-email` | 邮箱验证 |
| POST | `/api/auth/refresh` | 刷新 Token |

### 证券行情
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stocks/search?q=` | 搜索证券 |
| GET | `/api/stocks/:symbol` | 个股详情 |
| GET | `/api/stocks/rank/gainers` | 涨幅排行 |
| GET | `/api/stocks/rank/losers` | 跌幅排行 |
| GET | `/api/stocks/rank/volume` | 成交量排行 |
| GET | `/api/market/quote/:symbol` | 实时报价 |
| GET | `/api/market/kline/:symbol` | K 线数据 |
| GET | `/api/market/intraday/:symbol` | 分时数据 |
| GET | `/api/market/indices` | 大盘指数 |
| GET | `/api/market/sectors` | 板块行情 |

### 自选股
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stocks/watchlist` | 获取自选股 |
| POST | `/api/stocks/watchlist` | 添加自选股 |
| DELETE | `/api/stocks/watchlist/:symbol` | 移除自选股 |

### AI 分析
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/analyze` | 请求 AI 分析 |
| GET | `/api/ai/history` | 分析历史 |
| GET | `/api/ai/:id` | 分析详情 |
| POST | `/api/v1/chat/completions` | OpenAI 兼容接口 (API Key) |

### 预警
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/alerts` | 预警列表 |
| POST | `/api/alerts` | 创建预警 |
| PUT | `/api/alerts/:id` | 更新预警 |
| DELETE | `/api/alerts/:id` | 删除预警 |

### 订阅 & 计费
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/subscription/plans` | 订阅计划列表 |
| POST | `/api/subscription/subscribe` | 订阅/升级 |
| GET | `/api/billing/balance` | Token 余额 |
| GET | `/api/billing/usage` | 使用量统计 |
| GET | `/api/billing/invoices` | 账单列表 |
| POST | `/api/keys/create` | 创建 API Key |
| GET | `/api/keys` | API Key 列表 |
| DELETE | `/api/keys/:id` | 删除 API Key |

### 智能客服
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/customer-service/chat` | 发送客服消息 |
| GET | `/api/customer-service/faq` | 获取常见问题 |
| GET | `/api/customer-service/categories` | 获取分类列表 |
| GET | `/api/customer-service/faq/:category` | 根据分类获取问题 |

## 订阅计划

| 功能 | Free | Starter | Pro | Enterprise |
|------|------|---------|-----|------------|
| 价格 | 免费 | ¥49/月 | ¥199/月 | ¥999/月 |
| 自选股数量 | 20 | 50 | 200 | 无限 |
| 预警数量 | 5 | 20 | 100 | 无限 |
| AI 分析/天 | 3 | 20 | 100 | 无限 |
| 实时行情 | 延迟15分钟 | 实时 | 实时 | 实时 |
| AI 模型 | 基础 | 标准 | 高级 | 全部 |
| API 调用 | - | 1,000/天 | 10,000/天 | 无限 |
| 数据导出 | - | CSV | CSV/Excel | 全格式 |
| 技术支持 | 社区 | 邮件 | 优先 | 专属 |

## 安全特性

- JWT Token 认证 + 自动续期
- API Key 机制（OpenAI 兼容格式）
- Rate Limiting 请求限流
- CORS 跨域配置
- Bcrypt 密码加密
- Helmet 安全头
- 邮箱验证注册
- HTTPS 就绪

## 文档

- [快速开始指南](./QUICK_START.md) — 5 分钟快速上手
- [API 接口文档](./docs/API.md) — 所有 API 端点详细说明
- [订阅与计费](./docs/SUBSCRIPTION_BILLING.md) — 订阅机制与计费模式
- [智能客服指南](./docs/CUSTOMER_SERVICE.md) — 智能客服使用说明
- [部署指南](./docs/DEPLOYMENT.md) — Docker / 云服务部署
- [安全审计报告](./docs/SECURITY_AUDIT_REPORT.md) — 安全评估

## 开发指南

### 环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
# 必填
MONGODB_URI=mongodb://localhost:27017/stock_smart
JWT_SECRET=your_jwt_secret_key

# 可选 (启用完整功能)
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.qq.com
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
MARKET_DATA_API_KEY=your_key
```

### 开发模式

```bash
# 后端热重载
npm run dev

# 前端热重载 (新终端)
cd client && npm run dev

# 同时启动前后端
npm run dev:all
```

### 生产构建

```bash
npm run build:client
npm start
```

## License

MIT

## 联系方式


- GitHub: [13888285815/stock](https://github.com/13888285815/stock)
