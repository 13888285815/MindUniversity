const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateJWT } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

// 注册
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, message: '注册成功，请查收验证邮件', data: result });
  } catch (error) { next(error); }
});

// 登录
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req.ip);
    res.json({ success: true, message: '登录成功', data: result });
  } catch (error) { next(error); }
});

// 刷新Token (增强验证)
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: '缺少刷新令牌' });
    }
    const result = await authService.refreshAccessToken(refreshToken, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// 获取当前用户
router.get('/me', authenticateJWT, async (req, res) => {
  res.json({ success: true, data: { user: authService.sanitizeUser(req.user) } });
});

// 更新资料
router.put('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const { username, email, profile } = req.body;
    const user = req.user;
    if (username) user.username = username;
    if (profile) user.profile = { ...user.profile, ...profile };
    user.updatedAt = new Date();
    await user.save();
    res.json({ success: true, data: { user: authService.sanitizeUser(user) } });
  } catch (error) { next(error); }
});

// 邮箱验证
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token, email } = req.body;
    const result = await authService.verifyEmail(token, email);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

// 重发验证邮件
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendVerificationEmail(email);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

// 创建 API Key
router.post('/keys', authenticateJWT, async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    const result = await authService.createAPIKey(req.userId, name, permissions);
    res.status(201).json({ success: true, message: 'API Key创建成功', data: result });
  } catch (error) { next(error); }
});

// 获取 API Keys
router.get('/keys', authenticateJWT, async (req, res, next) => {
  try {
    const keys = await authService.getUserAPIKeys(req.userId);
    res.json({ success: true, data: { keys } });
  } catch (error) { next(error); }
});

// 删除 API Key
router.delete('/keys/:keyId', authenticateJWT, async (req, res, next) => {
  try {
    await authService.deleteAPIKey(req.userId, req.params.keyId);
    res.json({ success: true, message: 'API Key已删除' });
  } catch (error) { next(error); }
});

// 登出 (撤销当前Token)
router.post('/logout', authenticateJWT, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    await authService.logout(token);
    res.json({ success: true, message: '登出成功' });
  } catch (error) { next(error); }
});

// 修改密码
router.post('/change-password', authenticateJWT, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请提供当前密码和新密码' });
    }
    const result = await authService.changePassword(req.userId, oldPassword, newPassword);
    // 修改密码后撤销当前token，强制重新登录
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    await authService.logout(token);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

module.exports = router;
