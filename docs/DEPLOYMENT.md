# 部署指南

本文档说明如何将 Mind University 部署到 GitHub 和 Vercel。

## 📋 部署检查清单

- [ ] 环境变量已配置
- [ ] MongoDB Atlas 连接已建立
- [ ] Stripe 密钥已获取（用于支付）
- [ ] GitHub 仓库已创建
- [ ] Vercel 项目已创建
- [ ] 域名已配置（可选）

## 🚀 步骤 1: 推送到 GitHub

### 1.1 创建 GitHub 仓库

访问 https://github.com/new 创建新仓库：
- 仓库名: `MindUniversity`
- 可见性: Private 或 Public
- 初始化: 不要添加 README, .gitignore, license

### 1.2 推送代码

```bash
# 确保当前目录在项目根目录
cd /Users/zzx/WorkBuddy/20260324102029

# 如果已经远程仓库，先删除
git remote remove origin

# 添加新的远程仓库
git remote add origin https://github.com/13888285815/MindUniversity.git

# 推送到 main 分支
git push -u origin main

# 如果遇到认证问题，使用 GitHub Token
# 1. 生成 Personal Access Token: https://github.com/settings/tokens
# 2. 使用 Token 作为密码:
git push https://<TOKEN>@github.com/13888285815/MindUniversity.git main
```

## 🌐 步骤 2: 部署到 Vercel

### 2.1 创建 Vercel 项目

1. 访问 https://vercel.com/new
2. 点击 "Import Git Repository"
3. 选择 `MindUniversity` 仓库
4. 配置项目：
   - **Project Name**: `minduniversity`
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (保持默认)
   - **Build Command**: `npm run build`
   - **Output Directory**: `public`

### 2.2 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

#### 必需变量
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
```

#### 可选变量
```env
STRIPE_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-...
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

### 2.3 部署

点击 "Deploy" 按钮开始部署。

Vercel 会自动：
1. 检出代码
2. 安装依赖
3. 运行测试
4. 构建项目
5. 部署到全球 CDN

### 2.4 获取部署 URL

部署完成后，Vercel 会提供一个 URL，例如：
- `https://minduniversity.vercel.app`
- 或自定义域名: `https://minduniversity.com`

## ⚙️ 步骤 3: 配置 GitHub Actions 自动部署

### 3.1 获取 Vercel 凭证

1. 安装 Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. 登录 Vercel:
   ```bash
   vercel login
   ```

3. 获取项目信息:
   ```bash
   vercel link
   
   # 查看项目 ID
   cat .vercel/project.json
   ```

4. 获取 Token:
   - 访问 https://vercel.com/account/tokens
   - 创建新 Token
   - 保存 Token

### 3.2 添加 GitHub Secrets

访问 GitHub 仓库设置:
1. 进入 Settings → Secrets and variables → Actions
2. 添加以下 secrets:

| Secret Name | Value |
|------------|-------|
| `VERCEL_TOKEN` | Vercel Token |
| `VERCEL_ORG_ID` | 组织 ID (从 project.json) |
| `VERCEL_PROJECT_ID` | 项目 ID (从 project.json) |
| `MONGODB_URI` | MongoDB 连接字符串 |
| `JWT_SECRET` | JWT 密钥 |

### 3.3 触发自动部署

推送代码到 `main` 分支时，GitHub Actions 会自动：
1. 运行测试
2. 构建项目
3. 部署到 Vercel

## 🗄️ 步骤 4: 配置数据库

### 4.1 创建 MongoDB Atlas 集群

1. 访问 https://www.mongodb.com/cloud/atlas/register
2. 创建免费账户
3. 创建新集群 (Free Tier)
4. 获取连接字符串

### 4.2 配置数据库访问

1. 在 Atlas 中创建数据库用户
2. 设置 IP 白名单 (允许 0.0.0.0/0)
3. 复制连接字符串到 Vercel 环境变量

## 💳 步骤 5: 配置支付 (可选)

### 5.1 Stripe

1. 注册 Stripe 账户: https://dashboard.stripe.com/register
2. 获取 API Keys:
   - Publishable Key (`pk_live_...`)
   - Secret Key (`sk_live_...`)
3. 配置 Webhook:
   - 创建 Endpoint: `https://your-domain.com/api/subscription/webhook`
   - 获取 Webhook Secret

### 5.2 支付宝

1. 注册支付宝开放平台: https://open.alipay.com
2. 创建应用
3. 获取 App ID, 密钥等

### 5.3 微信支付

1. 注册微信支付商户平台
2. 获取商户号, API 密钥等

## 🎯 步骤 6: 配置域名 (可选)

### 6.1 在 Vercel 中添加域名

1. 进入 Vercel 项目设置 → Domains
2. 添加域名: `minduniversity.com`
3. 配置 DNS 记录

### 6.2 配置 DNS

在域名注册商处添加记录:

```
Type    Name        Value
A       www         76.76.21.21
CNAME   (empty)    cname.vercel-dns.com
```

## ✅ 步骤 7: 验证部署

### 7.1 检查清单

- [ ] 网站可以访问
- [ ] HTTPS 正常工作
- [ ] 多语言切换正常
- [ ] 响应式设计在不同设备正常
- [ ] 用户注册/登录功能正常
- [ ] 订阅功能正常
- [ ] API 端点可以访问
- [ ] 数据库连接正常

### 7.2 测试命令

```bash
# 健康检查
curl https://minduniversity.com/health

# API 测试
curl https://minduniversity.com/api/subscription/plans

# 安全头检查
curl -I https://minduniversity.com
```

## 🔍 监控和日志

### Vercel 日志
- 访问 Vercel Dashboard → Logs
- 实时查看错误和警告

### MongoDB Atlas
- 访问 Atlas Dashboard → Metrics
- 监控数据库性能

### GitHub Actions
- 访问 GitHub 仓库 → Actions
- 查看部署历史和日志

## 🔄 更新部署

### 更新代码
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

GitHub Actions 会自动触发部署。

### 更新环境变量
1. 在 Vercel 项目设置中更新
2. 重新部署项目

## 🚨 故障排查

### 问题: 部署失败
**解决方案**:
1. 检查 Vercel 日志
2. 确认所有依赖已安装
3. 检查环境变量配置

### 问题: 数据库连接失败
**解决方案**:
1. 检查 MongoDB 连接字符串
2. 确认 IP 白名单配置
3. 验证数据库用户权限

### 问题: API 返回 403/401
**解决方案**:
1. 检查 JWT Secret 配置
2. 验证 Token 生成和验证逻辑
3. 检查 CORS 配置

### 问题: 支付失败
**解决方案**:
1. 验证 API Keys
2. 检查 Webhook 配置
3. 查看支付平台日志

## 📞 联系支持

如果遇到问题：
- Email: support@minduniversity.com
- GitHub Issues: https://github.com/13888285815/MindUniversity/issues
- Vercel 文档: https://vercel.com/docs
