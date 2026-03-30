# Vercel 自定义域名配置指南

## 域名信息
- **主域名**: `minduniversity.yndxw.com`
- **DNS 状态**: 已配置解析
- **项目 ID**: `prj_21vjUy5DiU4oJbuYlck9AYHKxD4d`

## 配置步骤

### 1. DNS 配置（已完成）
在域名注册商处添加以下 DNS 记录：

```
类型: CNAME
主机记录: minduniversity
记录值: cname.vercel-dns.com
TTL: 600
```

### 2. Vercel 域名添加（需要手动操作）

#### 方法一：通过 Vercel Dashboard
1. 登录 Vercel Dashboard
2. 进入项目 `client-tau-lime-93`
3. 点击 **Settings** → **Domains**
4. 输入域名 `minduniversity.yndxw.com`
5. 点击 **Add**

#### 方法二：通过 CLI（需要先登录）
```bash
# 登录 Vercel
vercel login

# 添加域名
vercel domains add minduniversity.yndxw.com
```

### 3. 域名验证
Vercel 会自动验证 DNS 配置，通常需要几分钟到几小时。

验证完成后，项目可以通过以下地址访问：
- https://minduniversity.yndxw.com
- https://client-tau-lime-93.vercel.app（原始 Vercel 域名）

### 4. SSL 证书
Vercel 会自动为自定义域名配置 SSL 证书（Let's Encrypt），通常在域名验证后自动生效。

## 注意事项

### 环境变量
确保在 Vercel 项目中配置了正确的环境变量：
- `MONGODB_URI`: MongoDB 连接字符串
- `JWT_SECRET`: JWT 密钥
- `API_BASE_URL`: API 基础地址（应设为 https://minduniversity.yndxw.com）

### CORS 配置
`vercel.json` 中已更新 CORS 配置，允许新域名：
```json
"Access-Control-Allow-Origin": "https://minduniversity.yndxw.com,https://client-tau-lime-93.vercel.app"
```

### 重新部署
添加域名后，需要重新部署项目以应用配置：
```bash
vercel --prod
```

或在 Vercel Dashboard 中点击 **Redeploy**

## 故障排查

### 域名无法访问
1. 检查 DNS 是否生效：`dig minduniversity.yndxw.com`
2. 在 Vercel Dashboard 检查域名状态
3. 确认 DNS 记录类型为 CNAME，值为 `cname.vercel-dns.com`

### SSL 证书未生效
- 证书通常在域名验证后自动生成
- 最长可能需要 24 小时
- 可在 Vercel Dashboard 的 Domains 页面查看状态

### 重定向问题
- 确保 `vercel.json` 中的 rewrites 配置正确
- SPA 路由需要将所有路径重定向到 `index.html`

## 项目链接
- Vercel Dashboard: https://vercel.com/dashboard
- 项目地址: https://vercel.com/chinas-projects-bdf7c525/client-tau-lime-93
- 域名: https://minduniversity.yndxw.com

## 更新历史
- 2026-03-30: 添加 minduniversity.yndxw.com 自定义域名配置
