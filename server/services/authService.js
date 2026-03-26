const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { User } = require('../models');
const database = require('../config/database');

class AuthService {
  // 邮件发送器
  getTransporter() {
    if (this.transporter) return this.transporter;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return this.transporter;
  }

  // 生成JWT Token (带jti用于撤销)
  generateToken(userId) {
    const jti = crypto.randomUUID();
    return {
      token: jwt.sign(
        { userId, jti, iat: Math.floor(Date.now() / 1000) },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      ),
      jti
    };
  }

  // 生成刷新Token (带jti)
  generateRefreshToken(userId, clientInfo = {}) {
    const jti = crypto.randomUUID();
    return jwt.sign(
      { userId, type: 'refresh', jti, ...clientInfo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  // 检查Token是否已被撤销
  async isTokenRevoked(jti) {
    try {
      const redis = database.getRedisClient();
      if (redis) {
        const revoked = await redis.get(`revoked:${jti}`);
        return !!revoked;
      }
    } catch (error) {
      // Redis不可用时跳过撤销检查，仅打印警告
      console.warn('Redis不可用，跳过Token撤销检查');
    }
    return false;
  }

  // 撤销Token (添加到Redis黑名单)
  async revokeToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const redis = database.getRedisClient();
      if (redis) {
        // 计算Token剩余有效期，设置Redis TTL
        const exp = decoded.exp || Math.floor(Date.now() / 1000) + 900;
        const ttl = Math.max(exp - Math.floor(Date.now() / 1000), 1);
        await redis.set(`revoked:${decoded.jti}`, '1', 'EX', ttl);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // 生成邮箱验证Token
  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 用户注册
  async register(userData) {
    const { username, email, password, ...otherData } = userData;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      throw new Error(existingUser.email === email ? '邮箱已被注册' : '用户名已存在');
    }

    const verificationToken = this.generateEmailVerificationToken();
    
    const user = await User.create({
      username,
      email,
      password,
      emailVerification: {
        token: verificationToken,
        verified: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时有效
      },
      ...otherData
    });

    // 发送验证邮件
    try {
      await this.sendVerificationEmail(user.email, verificationToken, username);
    } catch (error) {
      console.error('发送验证邮件失败:', error.message);
      // 不阻断注册流程
    }

    const { token, jti } = this.generateToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      jti,
      emailSent: true
    };
  }

  // 发送邮箱验证
  async sendVerificationEmail(email, token, username) {
    const transporter = this.getTransporter();
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}&email=${email}`;

    await transporter.sendMail({
      from: `"智慧证券" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `欢迎加入智慧证券 - 请验证您的邮箱`,
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:10px 10px 0 0;">
            <h1 style="color:#e94560;margin:0;">智慧证券分析平台</h1>
          </div>
          <div style="background:#fff;padding:30px;border:1px solid #eee;border-top:none;border-radius:0 0 10px 10px;">
            <p style="color:#333;font-size:16px;">Hi <strong>${username}</strong>,</p>
            <p style="color:#666;line-height:1.6;">感谢您注册智慧证券分析平台！请点击下方按钮验证您的邮箱地址：</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${verifyUrl}" style="background:#e94560;color:#fff;padding:12px 40px;border-radius:5px;text-decoration:none;font-size:16px;display:inline-block;">验证邮箱</a>
            </div>
            <p style="color:#999;font-size:13px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
            <p style="color:#666;word-break:break-all;font-size:13px;">${verifyUrl}</p>
            <p style="color:#999;font-size:12px;margin-top:20px;">此链接24小时内有效。如果您没有注册此账户，请忽略此邮件。</p>
          </div>
        </div>
      `
    });
  }

  // 验证邮箱
  async verifyEmail(token, email) {
    const user = await User.findOne({
      email,
      'emailVerification.token': token,
      'emailVerification.verified': false
    });

    if (!user) throw new Error('无效的验证链接');
    if (user.emailVerification.expiresAt < new Date()) throw new Error('验证链接已过期，请重新发送');

    user.emailVerification.verified = true;
    user.emailVerification.verifiedAt = new Date();
    user.emailVerification.token = null;
    await user.save();

    return { message: '邮箱验证成功', user: this.sanitizeUser(user) };
  }

  // 重新发送验证邮件
  async resendVerificationEmail(email) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('用户不存在');
    if (user.emailVerification.verified) throw new Error('邮箱已验证');

    const token = this.generateEmailVerificationToken();
    user.emailVerification.token = token;
    user.emailVerification.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await this.sendVerificationEmail(user.email, token, user.username);
    return { message: '验证邮件已发送' };
  }

  // 用户登录
  async login(email, password, ip) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('邮箱或密码错误');

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new Error('邮箱或密码错误');

    if (!user.isActive) throw new Error('账户已被禁用');

    // 检查账户是否被锁定
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMin = Math.ceil((user.lockUntil - new Date()) / 60000);
      throw new Error(`账户已被锁定，请 ${remainingMin} 分钟后再试`);
    }

    user.lastLoginAt = new Date();
    user.lastLoginIP = ip;
    user.loginCount = (user.loginCount || 0) + 1;
    user.loginFailures = 0; // 重置失败计数
    user.lockUntil = null;   // 解除锁定
    await user.save();

    const { token, jti } = this.generateToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      jti
    };
  }

  // 登出 (撤销当前Token)
  async logout(token) {
    if (token) {
      await this.revokeToken(token);
    }
    return { message: '登出成功' };
  }

  // 刷新Token (增强验证)
  async refreshAccessToken(refreshToken, clientIP, userAgent) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      if (decoded.type !== 'refresh') throw new Error('无效的刷新令牌');

      // 检查刷新Token是否已被撤销
      const isRevoked = await this.isTokenRevoked(decoded.jti);
      if (isRevoked) throw new Error('刷新令牌已被撤销');

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) throw new Error('用户不存在或已被禁用');

      const { token, jti } = this.generateToken(user._id);
      return { token, jti };
    } catch (error) {
      throw new Error('刷新令牌无效或已过期');
    }
  }

  // 修改密码 (撤销所有Token)
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw new Error('用户不存在');

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) throw new Error('当前密码错误');

    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    return { message: '密码修改成功，请重新登录' };
  }

  // 创建API Key
  async createAPIKey(userId, name, permissions = []) {
    const user = await User.findById(userId);
    if (!user) throw new Error('用户不存在');
    if (!user.subscription.features.apiAccess) {
      throw new Error('当前订阅计划不支持API访问，请升级到Pro或Enterprise计划');
    }

    const keyId = crypto.randomUUID();
    const apiKey = `${process.env.API_KEY_PREFIX || 'sk_stock_'}${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    user.apiKeys.push({
      keyId, keyPrefix: apiKey.substring(0, 12), keyHash, name, permissions
    });
    await user.save();

    return { apiKey, keyId, name, permissions };
  }

  // 删除API Key
  async deleteAPIKey(userId, keyId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('用户不存在');

    const index = user.apiKeys.findIndex(k => k.keyId === keyId);
    if (index === -1) throw new Error('API Key不存在');

    user.apiKeys.splice(index, 1);
    await user.save();
  }

  // 获取API Keys
  async getUserAPIKeys(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('用户不存在');
    return user.apiKeys.map(k => ({
      keyId: k.keyId, keyPrefix: k.keyPrefix, name: k.name,
      permissions: k.permissions, lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt, isActive: k.isActive
    }));
  }

  // 清理用户信息 (移除敏感字段)
  sanitizeUser(user) {
    const obj = user.toObject ? user.toObject() : user;
    const sensitiveFields = ['password', '__v', 'apiKeys', 'emailVerification'];
    sensitiveFields.forEach(field => delete obj[field]);
    return obj;
  }
}

module.exports = new AuthService();
