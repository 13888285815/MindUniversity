# 快速开始指南

## 项目概述

智慧证券分析平台 — 类银河证券智慧星 + 同花顺的智能证券分析应用，集成订阅体系与 AI API Tokens 精确计费系统。

### 核心功能
- 实时行情推送 (Socket.io)
- K 线图表 / 分时图 / 五档盘口
- AI 智能分析 (技术面 + 基本面 + 风险评估)
- 自选股 & 价格预警
- 四档订阅计划 (Free/Starter/Pro/Enterprise)
- OpenAI 兼容的 API Token 计费接口

### 技术栈
- **后端**: Node.js + Express + MongoDB + Redis + Socket.io
- **前端**: Vue 3 + Vite + Element Plus + ECharts + Pinia
- **支付**: Stripe | **认证**: JWT + API Key

---

## 本地开发

### 1. 克隆仓库

```bash
git clone https://github.com/13888285815/stock.git
cd stock
```

### 2. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client && npm install && cd ..
```

### 3. 启动数据库

```bash
# MongoDB
brew services start mongodb-community

# Redis
brew services start redis
```

### 4. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少配置以下必填项：

```env
MONGODB_URI=mongodb://localhost:27017/stock_smart
JWT_SECRET=your_jwt_secret_key_change_in_production
```

可选配置（启用完整功能）：

```env
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.qq.com
SMTP_USER=your_email@qq.com
SMTP_PASS=your_smtp_password
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
MARKET_DATA_API_KEY=your_key
```

### 5. 启动服务

**方式一：同时启动前后端**
```bash
npm run dev:all
```

**方式二：分别启动**

终端 1 — 后端：
```bash
npm run dev
# http://localhost:3000
```

终端 2 — 前端：
```bash
cd client && npm run dev
# http://localhost:5173
```

### 6. 访问应用

- 前端界面: http://localhost:5173
- 后端 API: http://localhost:3000

---

## 核心功能使用

### 注册 & 登录

```bash
# 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"测试用户"}'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 搜索证券

```bash
curl http://localhost:3000/api/stocks/search?q=贵州茅台
```

### 获取 K 线数据

```bash
curl http://localhost:3000/api/market/kline/600519?period=day
```

### AI 智能分析

```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"600519"}'
```

### 创建 API Key

```bash
curl -X POST http://localhost:3000/api/keys/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My App"}'
```

### OpenAI 兼容接口调用

```bash
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role":"user","content":"分析贵州茅台的投资价值"}]
  }'
```

---

## 订阅计划

| 计划 | 价格 | 自选股 | 预警 | AI分析/天 | API调用 |
|------|------|--------|------|-----------|---------|
| Free | 免费 | 20 | 5 | 3 | - |
| Starter | ¥49/月 | 50 | 20 | 20 | 1,000/天 |
| Pro | ¥199/月 | 200 | 100 | 100 | 10,000/天 |
| Enterprise | ¥999/月 | 无限 | 无限 | 无限 | 无限 |

---

## 常用命令

### 开发
```bash
npm run dev          # 后端热重载
npm run dev:all      # 前后端同时启动
cd client && npm run dev  # 仅前端

# 生产构建
npm run build:client  # 构建前端
npm start             # 启动生产服务
```

### 数据库
```bash
brew services start mongodb-community  # 启动 MongoDB
brew services start redis              # 启动 Redis
brew services stop mongodb-community   # 停止 MongoDB
brew services stop redis               # 停止 Redis
```

### Git
```bash
git status          # 查看状态
git add .           # 暂存所有更改
git commit -m "msg" # 提交
git push            # 推送到 GitHub
```

---

## 注意事项

1. **环境变量**: 生产环境务必修改 `JWT_SECRET` 等密钥
2. **数据库**: 确保 MongoDB 和 Redis 服务已启动
3. **行情数据**: 开发模式使用模拟数据，生产环境需配置 `MARKET_DATA_API_KEY` 接入真实行情
4. **AI 功能**: 需配置 `OPENAI_API_KEY` 才能使用真实 AI 分析
5. **支付功能**: 需配置 Stripe 密钥才能使用在线支付
6. **邮箱验证**: 需配置 SMTP 才能发送验证邮件

---

## 完整文档

- [API 接口文档](./docs/API.md) — 所有 API 端点详细说明
- [订阅与计费](./docs/SUBSCRIPTION_BILLING.md) — 订阅机制与计费模式
- [部署指南](./docs/DEPLOYMENT.md) — Docker / 云服务部署
- [安全审计报告](./docs/SECURITY_AUDIT_REPORT.md) — 安全评估
- [项目说明](./README.md) — 完整项目介绍

---

## 支持

- GitHub: [13888285815/stock](https://github.com/13888285815/stock)

