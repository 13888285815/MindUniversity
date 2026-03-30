const express = require('express');
const router = express.Router();
const customerService = require('../services/customerServiceService');
const auth = require('../middleware/auth');

/**
 * POST /api/customer-service/chat
 * 智能客服对话
 */
router.post('/chat', auth.authenticateJWT, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '请输入消息内容'
      });
    }

    // 检查是否有关键词快速回复
    const quickReply = customerService.getQuickReply(message);
    if (quickReply) {
      return res.json({
        success: true,
        reply: quickReply,
        isQuickReply: true
      });
    }

    // 调用 AI 服务
    const result = await customerService.processCustomerMessage(
      req.user.id,
      message,
      history
    );

    res.json(result);
  } catch (error) {
    console.error('Customer service chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '智能客服服务暂时不可用'
    });
  }
});

/**
 * GET /api/customer-service/faq
 * 获取常见问题列表
 */
router.get('/faq', (req, res) => {
  try {
    const faq = customerService.getFAQ();
    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({
      success: false,
      message: '获取常见问题失败'
    });
  }
});

/**
 * GET /api/customer-service/categories
 * 获取 FAQ 分类
 */
router.get('/categories', (req, res) => {
  try {
    const faq = customerService.getFAQ();
    const categories = faq.map(item => item.category);
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取分类失败'
    });
  }
});

/**
 * GET /api/customer-service/faq/:category
 * 根据分类获取常见问题
 */
router.get('/faq/:category', (req, res) => {
  try {
    const { category } = req.params;
    const faq = customerService.getFAQ();
    const categoryFAQ = faq.find(item => item.category === category);

    if (!categoryFAQ) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    res.json({
      success: true,
      data: categoryFAQ.questions
    });
  } catch (error) {
    console.error('Get category FAQ error:', error);
    res.status(500).json({
      success: false,
      message: '获取问题失败'
    });
  }
});

module.exports = router;
