const express = require('express');
const router = express.Router();
const alertService = require('../services/alertService');
const { authenticateJWT } = require('../middleware/auth');

// 创建预警
router.post('/', authenticateJWT, async (req, res, next) => {
  try {
    const alert = await alertService.createAlert(req.userId, req.body);
    res.status(201).json({ success: true, message: '预警创建成功', data: alert });
  } catch (error) { next(error); }
});

// 获取预警列表
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const result = await alertService.getAlerts(req.userId, req.query);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// 删除预警
router.delete('/:id', authenticateJWT, async (req, res, next) => {
  try {
    await alertService.deleteAlert(req.userId, req.params.id);
    res.json({ success: true, message: '预警已删除' });
  } catch (error) { next(error); }
});

// 暂停/恢复预警
router.put('/:id/toggle', authenticateJWT, async (req, res, next) => {
  try {
    const alert = await alertService.toggleAlert(req.userId, req.params.id);
    res.json({ success: true, message: `预警已${alert.status === 'active' ? '恢复' : '暂停'}`, data: alert });
  } catch (error) { next(error); }
});

module.exports = router;
