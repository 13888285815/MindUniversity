const jwt = require('jsonwebtoken');
const { User } = require('../models');
const crypto = require('crypto');

class AuthService {
  // 生成JWT Token
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // 生成刷新Token
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  // 用户注册
  async register(userData) {
    const { username, email, password, ...otherData } = userData;

    // 检查用户名是否存在
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否存在
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      throw new Error('邮箱已被注册');
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      password,
      ...otherData
    });

    // 生成Token
    const token = this.generateToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken
    };
  }

  // 用户登录
  async login(email, password, ip) {
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('邮箱或密码错误');
    }

    // 检查账户状态
    if (!user.isActive) {
      throw new Error('账户已被禁用');
    }

    // 更新最后登录信息
    user.lastLoginAt = new Date();
    user.lastLoginIP = ip;
    await user.save();

    // 生成Token
    const token = this.generateToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken
    };
  }

  // 刷新Token
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      if (decoded.type !== 'refresh') {
        throw new Error('无效的刷新令牌');
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('用户不存在');
      }

      const newToken = this.generateToken(user._id);

      return {
        token: newToken
      };
    } catch (error) {
      throw new Error('刷新令牌无效或已过期');
    }
  }

  // 创建API Key
  async createAPIKey(userId, name, permissions = []) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const keyId = crypto.randomUUID();
    const apiKey = `${process.env.API_KEY_PREFIX || 'sk_'}${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    user.apiKeys.push({
      keyId,
      keyPrefix: apiKey.substring(0, 8),
      keyHash,
      name,
      permissions,
      lastUsedAt: null
    });

    await user.save();

    return {
      apiKey,
      keyId,
      name,
      permissions
    };
  }

  // 删除API Key
  async deleteAPIKey(userId, keyId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const apiKeyIndex = user.apiKeys.findIndex(
      k => k.keyId === keyId
    );

    if (apiKeyIndex === -1) {
      throw new Error('API Key不存在');
    }

    user.apiKeys[apiKeyIndex].isActive = false;
    user.apiKeys.splice(apiKeyIndex, 1);

    await user.save();
  }

  // 获取用户的所有API Keys
  async getUserAPIKeys(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    return user.apiKeys.map(key => ({
      keyId: key.keyId,
      keyPrefix: key.keyPrefix,
      name: key.name,
      permissions: key.permissions,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      isActive: key.isActive
    }));
  }

  // 验证API Key
  async validateAPIKey(apiKeyHash) {
    const user = await User.findOne({
      'apiKeys.keyHash': apiKeyHash,
      'apiKeys.isActive': true,
      isActive: true
    });

    if (!user) {
      return null;
    }

    const apiKeyData = user.apiKeys.find(
      k => k.keyHash === apiKeyHash
    );

    return {
      user,
      apiKey: apiKeyData
    };
  }

  // 更新API Key最后使用时间
  async updateAPIKeyLastUsed(userId, keyId) {
    await User.updateOne(
      {
        _id: userId,
        'apiKeys.keyId': keyId
      },
      {
        $set: {
          'apiKeys.$.lastUsedAt': new Date()
        }
      }
    );
  }

  // 清理用户信息（不返回敏感数据）
  sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;
    return userObj;
  }
}

module.exports = new AuthService();
