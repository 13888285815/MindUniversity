const express = require('express');
const router = express.Router();
const aiAnalysisService = require('../services/aiAnalysisService');
const { authenticateJWT, authenticateAPIKey, requireTokenBalance } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// 请求AI分析
router.post('/analyze', authenticateJWT, requireTokenBalance, apiLimiter, async (req, res, next) => {
  try {
    const { symbol, market, type } = req.body;
    const analysis = await aiAnalysisService.analyzeStock(req.userId, symbol, market, type);
    res.status(201).json({ success: true, message: '分析完成', data: analysis });
  } catch (error) { next(error); }
});

// 获取分析历史
router.get('/history', authenticateJWT, async (req, res, next) => {
  try {
    const result = await aiAnalysisService.getAnalysisHistory(req.userId, req.query);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

// 获取单条分析
router.get('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const analysis = await aiAnalysisService.getAnalysis(req.params.id, req.userId);
    res.json({ success: true, data: { analysis } });
  } catch (error) { next(error); }
});

// 删除分析
router.delete('/:id', authenticateJWT, async (req, res, next) => {
  try {
    await aiAnalysisService.deleteAnalysis(req.params.id, req.userId);
    res.json({ success: true, message: '分析记录已删除' });
  } catch (error) { next(error); }
});

// AI API (OpenAI兼容，用于API Token计费)
router.post('/v1/chat/completions', authenticateAPIKey, requireTokenBalance, apiLimiter, async (req, res, next) => {
  try {
    const { messages, model } = req.body;
    const promptTokens = Math.ceil(JSON.stringify(messages).length / 4);
    
    // 模拟AI分析回复
    const reply = "智慧证券AI助手: 请提供具体的分析需求，例如技术分析、基本面评估或风险评估。";
    const completionTokens = Math.ceil(reply.length / 4);

    const billingService = require('../services/billingService');
    await billingService.deductUserTokens(req.userId, promptTokens + completionTokens);
    await billingService.logAPIRequest({
      user: req.userId, apiKey: req.apiKeyHash, apiKeyId: req.apiKeyId,
      endpoint: '/api/ai/v1/chat/completions', method: 'POST', model,
      tokenUsage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
      request: { query: {} },
      response: { statusCode: 200, responseTime: 500 },
      ip: req.ip
    });

    res.json({
      id: `chatcmpl-${Date.now()}`, object: 'chat.completion', created: Math.floor(Date.now() / 1000),
      model: model || 'gpt-4',
      choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }],
      usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens }
    });
  } catch (error) { next(error); }
});

module.exports = router;
