# Long-term Memory

## 项目: 证券智慧分析平台
- 目标仓库: https://github.com/13888285815/stock
- 需求: 类银河证券智慧星+同花顺, 集成 AI 分析、订阅计费、API Token 管理
- 订阅体系: 分层定价 (Free/Starter/Pro/Enterprise)
- 品牌信息: 云南意念科技有限责任公司, 滇ICP备10000001号-1, v2026.03.26
- 前端 API 配置: client/.env 中 VITE_API_BASE_URL, 统一通过 utils/config.js 导出

## 安全加固 (2026-03-26)
- 完成两轮安全审计和修复, 安全评分 5.5→8.5
- 关键修复: 敏感数据日志清理、CORS严格化、API硬编码消除、请求体限制、Permissions-Policy
- 前端10个文件的 API 地址从硬编码 localhost:3000 改为环境变量

## Vercel 部署 (2026-03-26)
- 前端已部署: https://client-tau-lime-93.vercel.app
- Vercel 项目: prj_21vjUy5DiU4oJbuYlck9AYHKxD4d (team: chinas-projects-bdf7c525)
- 框架: Vite, rootDirectory: client, outputDirectory: dist
- SPA 路由已配置 (vercel.json rewrites)
- 后端 API 尚未部署到 Vercel (需要 MongoDB Atlas + 改造 Serverless)

## 智能客服系统 (2026-03-28)
- AI 驱动的智能对话系统，支持 24/7 自动客服
- 快速回复系统：13 个关键词秒级回复
- FAQ 知识库：5 个分类共 15 个常见问题
- 悬浮按钮组件：右下角客服入口，支持迷你聊天窗口
- 文档：docs/CUSTOMER_SERVICE.md
- 后端路由：/api/customer-service/*

## 本地开发环境 (2026-03-29)
- MongoDB Atlas 直连 shard 节点 (DNS SRV 解析超时问题, 已用直连绕过)
- Redis 未启动 (可选, 不影响核心功能)
- 测试账号: test@example.com / Test1234, testuser2@example.com / Test1234
- 密码规则: 至少8位, 必须含大小写字母+数字

## 51zxw.net 克隆网站 (2026-03-30)
- 文件位置: /Users/zzx/WorkBuddy/20260324102029/public/51zxw-clone.html
- 单文件完整实现，包含所有功能：导航栏、轮播图、课程分类、课程列表、搜索、登录注册弹窗、课程详情
- 数据：10大课程分类、28门示例课程、6位明星讲师、5条校园动态
- 交互：轮播自动播放、搜索过滤、课程详情弹窗、登录注册弹窗、滚动进度条

## 意念大学 (Mind University) (2026-03-30)
- 域名: minduniversity.yndxw.com (DNS 已配置, Vercel 返回空白待排查)
- GitHub Pages: https://13888285815.github.io/MindUniversity/MindUniver.html (正常)
- 本地服务器: http://localhost:8888/MindUniver.html (已启动)
- 原始 Vercel 域名: https://client-tau-lime-93.vercel.app (无法访问)
- 多语言支持: 中日韩英法德阿拉伯 7 种语言, IP 自动检测
- 订阅系统: Crunchbase 风格, Free/Starter/Pro/Enterprise 四档
- 品牌年份: 自 2007 年起 (已从 2006 更新)
- 配置文件: vercel.json (简化为纯静态部署)
- 文档: docs/VERCEL_DOMAIN_CONFIG.md, docs/DEPLOYMENT_CHECKLIST.md, docs/VERCEL_CONFIG_GUIDE.md, docs/VERCEL_NEW_PROJECT_GUIDE.md

## 用户偏好
- zzx: 独立开发者/创业者, 技术栈 Node.js + Vue.js
- 全功能需求不要阉割版
- 中文交流, 代码注释英文
