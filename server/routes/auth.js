const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateJWT } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

// 用户注册
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 用户登录
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;

    const result = await authService.login(email, password, ip);

    res.json({
      success: true,
      message: '登录成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 刷新Token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 获取当前用户信息
router.get('/me', authenticateJWT, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// 更新用户资料
router.put('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const { username, email, profile } = req.body;
    const user = req.user;

    if (username && username !== user.username) {
      const existingUser = await require('../models').User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await require('../models').User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被使用'
        });
      }
      user.email = email;
    }

    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: '资料更新成功',
      data: {
        user: authService.sanitizeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 创建API Key
router.post('/keys', authenticateJWT, async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    const result = await authService.createAPIKey(req.userId, name, permissions);

    res.status(201).json({
      success: true,
      message: 'API Key创建成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 获取所有API Keys
router.get('/keys', authenticateJWT, async (req, res, next) => {
  try {
    const keys = await authService.getUserAPIKeys(req.userId);

    res.json({
      success: true,
      data: {
        keys
      }
    });
  } catch (error) {
    next(error);
  }
});

// 删除API Key
router.delete('/keys/:keyId', authenticateJWT, async (req, res, next) => {
  try {
    const { keyId } = req.params;
    await authService.deleteAPIKey(req.userId, keyId);

    res.json({
      success: true,
      message: 'API Key已删除'
    });
  } catch (error) {
    next(error);
  }
});

// 登出
router.post('/logout', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

module.exports = router;
