# 意念科技在线学习平台 - 安全审计报告

**审计日期**: 2026-03-26  
**修复日期**: 2026-03-26  
**审计范围**: 完整代码库（后端、前端、配置、文档）  
**审计标准**: OWASP Top 10 (2021)

---

## 执行摘要

**总体安全评分**: **5.5/10** → **8.5/10** (修复后)

### 漏洞统计 (按严重程度)

| 严重程度 | 原始 | 已修复 | 剩余 |
|---------|------|--------|------|
| 严重 (Critical) | 4 | 4 | 0 |
| 高危 (High) | 6 | 5 | 1 |
| 中危 (Medium) | 8 | 4 | 4 |
| 低危 (Low) | 5 | 1 | 4 |
| **总计** | **23** | **14** | **9** |

---

## 严重漏洞 (Must Fix Immediately)

### 1. 硬编码的生产环境密钥和凭证 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**:
> - 更新 `.env.example` 移除弱默认值，添加生成强密钥的说明
> - 在 `server.js` 启动时添加生产环境安全校验
> - 检查 JWT_SECRET 长度 (>=32) 和弱密钥特征
> - 检查 CORS_ORIGIN 不为 `*`
> - 缺少必需环境变量时直接退出进程

**文件**: `.env.example`, `server.js`

**OWASP分类**: A02:2021 - Cryptographic Failures (加密失败)

**文件位置**: `.env` (第9-26行)

**描述**:
```env
JWT_SECRET=selfstudy-jwt-secret-key-change-in-production-2024
ADMIN_PASSWORD=admin123
OPENAI_API_KEY=sk-your-openai-api-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

**漏洞详情**:
- JWT密钥使用弱默认值
- 管理员密码硬编码为 `admin123`
- API密钥作为示例值暴露

**利用场景**:
攻击者获取这些凭证后可以：
1. 使用 `admin123` 登录管理员账户
2. 使用JWT密钥伪造任意用户令牌
3. 访问支付和AI API资源

**修复建议**:
```javascript
// 正确做法：强制要求环境变量
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-in-production')) {
  throw new Error('JWT_SECRET must be set to a secure random value in production');
}

if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'admin123') {
  throw new Error('ADMIN_PASSWORD must be changed from default');
}

// 生成强密钥
// openssl rand -base64 64
JWT_SECRET=your-64-byte-random-secret-from-openssl
```

---

### 2. 敏感数据记录到日志 (堆栈跟踪暴露) ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**:
> - `errorHandler.js`: 生产环境只记录错误元信息，不输出完整堆栈
> - `APILog.js` 模型: 移除 `request.headers`、`request.body`、`response.body`、`error.stack` 字段
> - `ai.js` 路由: 只记录元数据，不存储消息内容和响应体
> - `auth.js` 中间件: API认证失败不再暴露 `error.message`

**文件**: `server/middleware/errorHandler.js`, `server/models/APILog.js`, `server/routes/ai.js`, `server/middleware/auth.js`

---

### 3. API密钥以明文形式存储和传输 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**:
> - `auth.js` 中间件: 对输入的 API Key 先进行 SHA256 哈希，再与数据库中的 keyHash 比较
> - 请求对象中不再存储明文 apiKey，改用 apiKeyHash
> - `ai.js` 路由中的日志使用 apiKeyHash 替代 apiKey

**文件**: `server/middleware/auth.js`, `server/routes/ai.js`

---

### 4. CORS配置允许任意来源 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**:
> - 生产环境: 严格按 CORS_ORIGIN 环境变量白名单验证
> - 开发环境: 只允许 localhost/127.0.0.1
> - 限制允许的 HTTP 方法和请求头
> - Socket.io CORS 配置同步更新
> - `server.js` 启动校验禁止生产环境使用 `*`

**文件**: `server/app.js`, `server.js`

**OWASP分类**: A01:2021 / A09:2021 - Security Logging Failures

**文件位置**: 
- `server/middleware/errorHandler.js` (第56-59行)
- `server/routes/api.js` (第130-153行)

**描述**:
```javascript
// errorHandler.js
res.status(500).json({
  success: false,
  message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
  ...(process.env.NODE_ENV === 'development' && { stack: err.stack })  // 危险！
});

// api.js - 记录完整请求体到数据库
await billingService.logAPIRequest({
  request: {
    headers: req.headers,  // 可能包含Authorization头
    body: req.body         // 完整请求体
  }
});
```

**漏洞详情**:
1. 错误处理在生产环境可能暴露堆栈跟踪
2. API日志记录存储完整的请求头和请求体，包括潜在的敏感信息
3. APILog模型存储`response.body`，可能包含AI生成的完整响应

**利用场景**:
数据库被攻击后，攻击者可以获取：
- 用户的完整API请求/响应历史
- 可能的JWT Token和API密钥
- 用户的私人对话内容

**修复建议**:
```javascript
// 1. 过滤敏感头部
const sanitizeHeaders = (headers) => {
  const sensitive = ['authorization', 'cookie', 'x-api-key'];
  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => 
      !sensitive.includes(key.toLowerCase())
    )
  );
};

// 2. 不要记录完整body
await billingService.logAPIRequest({
  request: {
    method: req.method,
    path: req.path,
    query: req.query,
    // 不记录 body 和 headers
  }
});

// 3. 移除响应体存储
response: {
  statusCode,
  responseTime
  // 不要存储 response.body
}
```

---

### 3. API密钥以明文形式存储和传输 ⚠️

**OWASP分类**: A02:2021 - Cryptographic Failures

**文件位置**: 
- `server/middleware/auth.js` (第144-162行)
- `server/services/authService.js` (第125-146行)

**描述**:
```javascript
// authService.js - 创建API密钥
const apiKey = `${process.env.API_KEY_PREFIX || 'sk_'}${crypto.randomBytes(24).toString('hex')}`;
const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

// auth.js - 验证时直接比较明文
const apiKeyData = user.apiKeys.find(
  k => k.keyHash === apiKey && k.isActive  // 问题：apiKey是明文，但存储的是hash
);
```

**漏洞详情**:
1. API密钥在创建后立即返回给用户，但只存储了SHA256哈希
2. 验证逻辑需要修改：应该对输入的API密钥进行哈希后再比较
3. 当前实现会因为哈希不匹配而永远验证失败（除非bug）

**利用场景**:
虽然密钥被哈希存储，但：
1. 如果密钥验证失败，用户可能无法正常使用API
2. 如果改为比较明文，则密钥以明文传输

**修复建议**:
```javascript
// 验证时正确哈希后再比较
const apiKey = authHeader.replace('Bearer ', '');
const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

const user = await User.findOne({
  'apiKeys.keyHash': apiKeyHash,
  'apiKeys.isActive': true,
  isActive: true
});
```

---

### 4. CORS配置允许任意来源 ⚠️

**OWASP分类**: A05:2021 - Security Misconfiguration

**文件位置**: `server/app.js` (第22-25行)

**描述**:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',  // 危险！
  credentials: true
}));
```

**漏洞详情**:
如果`CORS_ORIGIN`环境变量未设置或为空，默认为`*`，允许任何来源的跨域请求。当`credentials: true`时，浏览器会拒绝`Access-Control-Allow-Origin: *`，但如果没有正确处理，可能导致配置错误。

**利用场景**:
攻击者可以：
1. 从任意网站向API发起跨域请求（如果存在JSONP或CORS配置错误）
2. 结合其他漏洞进行攻击

**修复建议**:
```javascript
app.use(cors({
  origin: function(origin, callback) {
    // 生产环境：严格验证来源
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',');
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('不允许的CORS来源'));
      }
    } else {
      // 开发环境允许localhost
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 高危漏洞 (Should Fix Soon)

### 5. 登录限流器的逻辑缺陷 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**:
> - 将 `skipSuccessfulRequests` 改为 `false`
> - 添加自定义 handler 记录可疑的暴力破解尝试
> - User 模型添加 `loginFailures` 和 `lockUntil` 字段
> - 登录逻辑中检查账户锁定状态

**文件**: `server/middleware/rateLimiter.js`, `server/models/User.js`, `server/services/authService.js`

**OWASP分类**: A07:2021 - Identification and Authentication Failures

**文件位置**: `server/middleware/rateLimiter.js` (第27-36行)

**描述**:
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,  // 问题：成功请求不计入
  message: {
    success: false,
    message: '登录尝试过多，请15分钟后再试'
  }
});
```

**漏洞详情**:
- `skipSuccessfulRequests: true` 意味着只要用户成功登录一次，就会重置限流计数
- 攻击者可以用单个密码字典，利用成功登录（如果用户使用弱密码）绕过限制

**利用场景**:
1. 攻击者可以使用常见密码组合对账号进行暴力破解
2. 只要偶尔猜对密码（用户使用弱密码），计数器就会重置
3. 实际上变成了"5次失败 + 1次成功 = 新5次尝试"

**修复建议**:
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,  // 无论成功失败都计数
  // 或者添加专用锁定机制
  handler: (req, res) => {
    // 账户锁定逻辑
    // User.updateOne({ email: req.body.email }, { lockUntil: Date.now() + 15*60*1000 })
    res.status(429).json({
      success: false,
      message: '登录尝试过多，账户已临时锁定'
    });
  }
});
```

---

### 6. NoSQL注入风险 - 正则表达式搜索

**OWASP分类**: A03:2021 - Injection

**文件位置**: `server/routes/courses.js` (第49-54行)

**描述**:
```javascript
// 搜索功能使用用户输入构造正则表达式
if (search) {
  query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
    { tags: { $in: [new RegExp(search, 'i')] } }
  ];
}
```

**漏洞详情**:
虽然Mongoose的`$regex`本身不直接执行代码，但正则表达式可能：
1. 使用户输入构造过于复杂的正则导致ReDoS攻击
2. 特殊正则字符可能导致意外匹配

**利用场景**:
攻击者可以输入 `(a+)+` 或 `(a{20})+` 类型的正则，导致CPU占用激增。

**修复建议**:
```javascript
// 1. 转义正则特殊字符
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 2. 限制正则复杂度
const sanitizeSearch = (input) => {
  // 限制长度
  if (input.length > 100) return null;
  // 转义特殊字符
  return escapeRegex(input);
};

// 3. 考虑使用全文搜索替代
if (search) {
  const sanitized = sanitizeSearch(search);
  if (sanitized) {
    query.$or = [
      { title: { $regex: sanitized, $options: 'i' } },
      // ...
    ];
  }
}
```

---

### 7. 缺少API端点的访问控制验证 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**:
> - 管理员统计路由从 `requireSubscription('pro')` 改为 `requireRole('admin')`
> - 确保只有 admin 角色才能访问系统统计

**文件**: `server/routes/billing.js`

---

### 8. JWT Token无撤销机制 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**:
> - Token 添加 `jti` (JWT ID) 字段用于唯一标识
> - 使用 Redis 存储已撤销的 Token (黑名单)
> - `authenticateJWT` 中间件验证 Token 是否已被撤销
> - 登出时撤销当前 Token
> - 修改密码后强制撤销 Token
> - JWT 有效期缩短为 15 分钟 (配合 refresh token)
> - Token 自动过期与 Redis TTL 同步

**文件**: `server/middleware/auth.js`, `server/services/authService.js`, `server/routes/auth.js`

---

### 9. 刷新令牌无来源验证 ✅ 已修复 (部分)

> **修复日期**: 2026-03-26  
> **修复方案**:
> - 添加 refresh token 撤销检查
> - 添加 refresh token 的 jti 用于唯一标识
> - 验证用户是否仍然活跃
> - ⚠️ IP/设备绑定暂未实现 (需要考虑移动网络切换场景)

**文件**: `server/services/authService.js`

**OWASP分类**: A01:2021 - Broken Access Control

**文件位置**: `server/routes/billing.js` (第151-166行)

**描述**:
```javascript
// 管理员路由只有订阅计划检查，没有角色检查
router.get('/admin/stats',
  authenticateJWT,
  requireSubscription('pro'),  // 只检查订阅，不检查role
  async (req, res, next) => {
    // 应该检查 req.user.role === 'admin'
  }
);
```

**漏洞详情**:
管理员API端点只验证用户是否有Pro订阅，没有验证用户是否真的是管理员。任何Pro用户都可以访问系统统计信息。

**利用场景**:
1. 任何付费Pro用户都可以获取系统统计信息
2. 可能暴露其他用户的使用数据

**修复建议**:
```javascript
const { authenticateJWT, requireRole } = require('../middleware/auth');

router.get('/admin/stats',
  authenticateJWT,
  requireRole('admin'),  // 添加角色检查
  async (req, res, next) => {
    // ...
  }
);
```

---

### 8. JWT Token无撤销机制

**OWASP分类**: A07:2021 - Identification and Authentication Failures

**文件位置**: `server/services/authService.js` (第7-22行)

**描述**:
```javascript
generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 没有token blacklist/revocation机制
// 没有登录设备管理
```

**漏洞详情**:
1. Token一旦签发，在过期前无法撤销
2. 用户修改密码后，旧Token仍然有效
3. 用户账户被禁用后，Token仍然可以用于认证
4. 无法强制单点登录或远程登出

**利用场景**:
1. 用户账户被盗后，攻击者的Token即使在密码重置后仍然有效
2. 管理员禁用账户后，用户仍可使用旧Token访问
3. 无法防止已泄露Token的滥用

**修复建议**:
```javascript
// 方案1：Redis存储token blacklist
const isTokenRevoked = async (tokenId) => {
  const redis = database.getRedisClient();
  const revoked = await redis.get(`revoked:${tokenId}`);
  return !!revoked;
};

// 方案2：使用较短的token有效期+refresh token
generateToken(userId) {
  return jwt.sign(
    { 
      userId,
      jti: crypto.randomUUID(),  // JWT ID
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }  // 缩短到15分钟
  );
}
```

---

### 9. 刷新令牌无来源验证

**OWASP分类**: A07:2021 - Identification and Authentication Failures

**文件位置**: `server/routes/auth.js` (第40-53行)

**描述**:
```javascript
router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;
  // 没有验证refresh token的来源IP或设备
  const result = await authService.refreshAccessToken(refreshToken);
  // ...
});
```

**漏洞详情**:
刷新令牌是长期有效的（30天），但可以在任何IP地址使用。没有验证令牌是否在预期设备上使用。

**利用场景**:
攻击者获取refresh token后，可以从任意IP获取新的access token。

**修复建议**:
```javascript
// 1. 将refresh token绑定到IP和设备
async refreshAccessToken(refreshToken, clientIP, userAgent) {
  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  
  // 验证IP（可选，使用时需要注意IP变化场景如移动网络）
  // if (decoded.clientIP !== clientIP) {
  //   // 发出安全警告或要求重新验证
  // }
  
  // 验证用户代理
  if (decoded.userAgent !== hashUserAgent(userAgent)) {
    throw new Error('设备不匹配');
  }
  
  // ...
}
```

---

### 10. API日志存储敏感请求信息 ✅ 已修复 (同 #2)

**OWASP分类**: A09:2021 - Security Logging Failures

**文件位置**: 
- `server/routes/api.js` (第142-152行)
- `server/models/APILog.js` (第44-62行)

**描述**:
```javascript
// api.js - 记录敏感数据
await billingService.logAPIRequest({
  request: {
    headers: req.headers,  // 包含Authorization
    body: req.body          // 包含messages
  },
  response: {
    body: responseBody     // AI完整响应
  }
});

// APILog.js - 定义存储结构
request: {
  headers: Object,  // 存储任意对象
  body: Object,
  query: Object
},
response: {
  body: mongoose.Schema.Types.Mixed,  // 存储任意数据
}
```

**漏洞详情**:
1. API日志存储完整请求头，包括Authorization
2. AI API的messages可能包含用户隐私信息
3. AI响应被完整存储，消耗大量数据库空间
4. 响应体可能包含敏感或不当内容

**修复建议**:
```javascript
// 只存储元数据，不存储内容
await billingService.logAPIRequest({
  request: {
    endpoint: req.path,
    method: req.method,
    queryParams: sanitizeQuery(req.query),  // 过滤敏感查询参数
    messageCount: messages?.length,
    model: model
  },
  response: {
    statusCode,
    responseTime,
    tokenUsage: responseBody?.usage
    // 不存储 responseBody.content
  }
});
```

---

## 中危漏洞 (Recommended)

### 11. 密码强度验证不足 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**: 最小长度改为8字符，添加正则验证要求大小写字母和数字

**文件**: `server/models/User.js`

---

### 13. 缺少并发请求限制对Token余额的竞态条件 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**: 使用 `findOneAndUpdate` 原子操作，条件+扣减在一条语句中完成

**文件**: `server/services/billingService.js`

---

### 17. 缺少安全的HTTP头部完整配置 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**: 
> - 配置完整的 Content-Security-Policy
> - 启用 HSTS (preload)
> - 配置 frameguard (deny)
> - 配置 referrerPolicy (strict-origin-when-cross-origin)
> - DNS prefetch 禁用
> - 其他安全头全部启用

**文件**: `server/app.js`

---

### 16. 静态文件服务配置不当 ✅ 已修复

> **修复日期**: 2026-03-26  
> **修复方案**:
> - uploads 目录 HTML 文件强制下载，防止 XSS
> - 添加 X-Content-Type-Options: nosniff
> - 设置安全的缓存时间

**文件**: `server/app.js`

### 12. 缺少邮箱验证强制要求 ⏳ 未修复 (待后续迭代)

---

### 14. 前端Token存储在LocalStorage ⏳ 未修复 (建议迁移到 httpOnly cookie)

---

### 15. 缺少CSRF保护 ⏳ 未修复 (建议配合 httpOnly cookie 方案一起实施)

---

### 18. 升级逻辑缺少支付验证 ⏳ 未修复 (需集成 Stripe 后完善)

## 低危漏洞 (Nice to Have)

### 19. 缺少密码修改历史记录 ⏳ 未修复

---

### 20. 缺少登录尝试失败锁定机制 ⚠️ 部分修复

> User 模型已添加 lockUntil 字段，loginFailures 计数器已添加，基础锁定逻辑已实现。

---

### 21. 日志缺少结构化格式 ⏳ 未修复 (建议使用 winston/pino)

---

### 22. API响应时间可能泄露信息 ⏳ 未修复

---

### 23. MongoDB连接缺少TLS配置 ⏳ 未修复 (生产部署时需配置)

### 6. NoSQL注入风险 - 正则表达式搜索 ⏳ 未修复

> 当前 courses.js 路由已被移除，该漏洞不再存在。如后续添加搜索功能，需注意正则转义。

---

## 低危漏洞 (Nice to Have)

### 19-23. 其他低危问题

- 缺少密码修改历史记录
- 缺少登录尝试失败锁定机制
- 日志缺少结构化格式
- API响应时间可能泄露信息
- MongoDB连接缺少TLS配置

---

## 已实施的安全最佳实践

| 功能 | 实现状态 | 文件位置 |
|------|---------|---------|
| Helmet安全头部 (增强配置) | 已实现 | server/app.js |
| HSTS (preload) | 已实现 | server/app.js |
| CSP 安全策略 | 已实现 | server/app.js |
| bcrypt密码哈希 (salt=10) | 已实现 | server/models/User.js |
| 密码强度验证 (8位+大小写+数字) | 已实现 | server/models/User.js |
| JWT认证中间件 (含撤销检查) | 已实现 | server/middleware/auth.js |
| JWT Token撤销机制 (Redis黑名单) | 已实现 | server/services/authService.js |
| 基础限流 | 已实现 | server/middleware/rateLimiter.js |
| API限流 | 已实现 | server/middleware/rateLimiter.js |
| 登录暴力破解防护 | 已实现 | server/middleware/rateLimiter.js |
| 角色权限控制 (含admin验证) | 已实现 | server/middleware/auth.js |
| 订阅计划检查 | 已实现 | server/middleware/auth.js |
| Token余额检查 (原子操作) | 已实现 | server/services/billingService.js |
| API Key哈希存储+验证 | 已实现 | server/middleware/auth.js |
| CORS 严格白名单 | 已实现 | server/app.js |
| 生产环境密钥校验 | 已实现 | server.js |
| 敏感数据过滤 | 已实现 | server/models/APILog.js |
| 静态文件安全 | 已实现 | server/app.js |
| Mongoose Schema验证 | 已实现 | 各模型文件 |
| 优雅关闭处理 | 已实现 | server/app.js |
| Gitignore排除.env | 已配置 | .gitignore |
| 账户锁定机制 | 已实现 | server/models/User.js, authService.js |
| 修改密码后强制重登录 | 已实现 | server/routes/auth.js |

---

## 修复优先级建议 (剩余未修复项)

### 建议优先修复
1. **#14** - 前端Token迁移到 httpOnly cookie
2. **#15** - 添加CSRF保护 (配合httpOnly cookie)
3. **#18** - 订阅升级添加Stripe支付验证

### 后续迭代
4. **#12** - 邮箱验证强制流程
5. **#19** - 密码修改历史记录
6. **#21** - 结构化日志 (winston/pino)
7. **#22** - API响应时间脱敏
8. **#23** - MongoDB TLS连接
9. 完整的XSS防护
10. 安全日志和监控

---

## 额外建议

### 渗透测试
建议在修复后进行专业的渗透测试，重点关注：
1. 支付流程安全性
2. API认证绕过
3. 敏感数据泄露

### 依赖检查
```bash
# 定期运行
npm audit
npm outdated
```

### 安全监控
- 部署告警系统监控异常登录
- 监控Token余额异常消耗
- 监控API错误率激增

---

**报告结束**

如需更详细的代码修改示例或有任何问题，请告知。
