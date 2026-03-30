# 部署检查清单 - minduniversity.yndxw.com

## 前置检查 ✅

- [x] DNS 解析已配置（CNAME → cname.vercel-dns.com）
- [x] Vercel 配置文件已更新（vercel.json）
- [x] CORS 配置已更新（支持新域名）
- [x] 前端 API 配置使用相对路径（自动适配域名）
- [x] 文档已创建（docs/VERCEL_DOMAIN_CONFIG.md）

## Vercel Dashboard 操作（需要手动完成）

### 1. 添加域名
- [ ] 登录 Vercel Dashboard
- [ ] 进入项目 `client-tau-lime-93` (prj_21vjUy5DiU4oJbuYlck9AYHKxD4d)
- [ ] 导航到 Settings → Domains
- [ ] 添加域名 `minduniversity.yndxw.com`
- [ ] 等待 DNS 验证通过（几分钟到几小时）

### 2. 配置环境变量
在 Settings → Environment Variables 中配置：
- [ ] `MONGODB_URI`（已存在，确认正确）
- [ ] `JWT_SECRET`（已存在，确认正确）
- [ ] `NODE_ENV=production`（已存在）
- [ ] （可选）添加其他业务相关环境变量

### 3. 重新部署
- [ ] 在项目页面点击 **Redeploy** 按钮
- [ ] 或使用 CLI: `vercel --prod`
- [ ] 等待部署完成（通常 1-2 分钟）

## 验证步骤

### 基础访问检查
- [ ] 访问 https://minduniversity.yndxw.com
- [ ] 检查页面是否正常加载
- [ ] 检查 HTTPS 证书是否有效

### 功能验证
- [ ] 测试多语言切换功能
- [ ] 测试订阅模态框显示
- [ ] 测试 API 调用（如果有后端接口）
- [ ] 测试响应式布局（移动端/桌面端）

### 安全检查
- [ ] 检查安全头部是否正确加载
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy
  - Permissions-Policy
  - Strict-Transport-Security
- [ ] 检查 CORS 配置是否生效

### 性能检查
- [ ] 使用 Lighthouse 检查性能分数
- [ ] 检查首次内容绘制（FCP）
- [ ] 检查最大内容绘制（LCP）
- [ ] 检查累积布局偏移（CLS）

## DNS 验证命令

### 使用 dig 验证
```bash
dig minduniversity.yndxw.com
```
期望输出应包含 `cname.vercel-dns.com`

### 使用 nslookup 验证
```bash
nslookup minduniversity.yndxw.com
```

### 使用 curl 测试
```bash
curl -I https://minduniversity.yndxw.com
```

## 故障排查

### 如果域名无法访问
1. 检查 DNS 是否完全生效：`dig minduniversity.yndxw.com`
2. 在 Vercel Dashboard 检查域名状态
3. 确认 DNS 记录类型为 CNAME
4. 等待 DNS 传播（最多 48 小时）

### 如果 SSL 证书未生效
- 证书通常自动生成，最多需要 24 小时
- 检查 Vercel Dashboard → Domains 页面的证书状态
- 确保域名 DNS 正确指向 Vercel

### 如果页面显示错误
- 检查 Vercel 部署日志
- 检查浏览器控制台错误信息
- 确认 vercel.json 配置正确
- 尝试清除浏览器缓存

## 回滚计划

如果出现问题，可以：
1. 暂时使用原 Vercel 域名：https://client-tau-lime-93.vercel.app
2. 在 Vercel Dashboard 删除自定义域名
3. 重新部署项目

## 联系方式

- Vercel Support: https://vercel.com/support
- 文档: docs/VERCEL_DOMAIN_CONFIG.md
- 项目仓库: https://github.com/13888285815/MindUniversity

## 部署完成后的待办事项

- [ ] 更新 README.md 添加新域名链接
- [ ] 更新社交媒体链接（如果有）
- [ ] 配置 Google Analytics（如果有）
- [ ] 配置网站监控工具
- [ ] 提交到搜索引擎收录

---

**最后更新**: 2026-03-30
**状态**: 等待手动配置 Vercel Dashboard
