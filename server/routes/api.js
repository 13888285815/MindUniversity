const express = require('express');
const router = express.Router();
const { authenticateAPIKey, requireTokenBalance } = require('../middleware/auth');
const billingService = require('../services/billingService');
const { APILog } = require('../models');
const { apiLimiter, createUserLimiter } = require('../middleware/rateLimiter');

// AI API路由

// 获取可用模型
router.get('/models', authenticateAPIKey, async (req, res, next) => {
  try {
    const models = [
      {
        id: 'gpt-4',
        object: 'model',
        created: 1699015354,
        owned_by: 'openai',
        tokens: {
          context: 8192,
          maxOutput: 4096
        }
      },
      {
        id: 'gpt-4-32k',
        object: 'model',
        created: 1699015354,
        owned_by: 'openai',
        tokens: {
          context: 32768,
          maxOutput: 4096
        }
      },
      {
        id: 'gpt-3.5-turbo',
        object: 'model',
        created: 1699015354,
        owned_by: 'openai',
        tokens: {
          context: 4096,
          maxOutput: 4096
        }
      },
      {
        id: 'text-embedding-ada-002',
        object: 'model',
        created: 1699015354,
        owned_by: 'openai',
        tokens: {
          context: 8191,
          maxOutput: 0
        }
      }
    ];

    res.json({
      success: true,
      data: {
        object: 'list',
        data: models
      }
    });
  } catch (error) {
    next(error);
  }
});

// 聊天完成 API (OpenAI兼容)
router.post('/v1/chat/completions',
  authenticateAPIKey,
  requireTokenBalance,
  apiLimiter,
  async (req, res, next) => {
    const startTime = Date.now();
    let statusCode = 200;
    let responseBody = null;
    let errorData = null;

    try {
      const { model, messages, temperature = 0.7, max_tokens = 1000 } = req.body;

      // 验证参数
      if (!model || !messages || !Array.isArray(messages)) {
        statusCode = 400;
        throw new Error('缺少必要参数: model 或 messages');
      }

      // 计算输入token数 (简化版,实际应使用tiktoken)
      const inputText = messages.map(m => m.content).join(' ');
      const promptTokens = Math.ceil(inputText.length / 4); // 粗略估计

      // 调用OpenAI API (实际使用时应该调用真实API)
      // 这里模拟一个响应
      const completionText = "这是一个模拟的AI响应。在实际部署时,这里会调用真实的OpenAI API。";
      const completionTokens = Math.ceil(completionText.length / 4);
      const totalTokens = promptTokens + completionTokens;

      // 计算费用
      const usage = await billingService.calculateAPIUsage(model, promptTokens, completionTokens);

      // 扣除用户token
      await billingService.deductUserTokens(req.userId, usage.tokensUsed);

      // 构建响应 (OpenAI格式)
      responseBody = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: completionText
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens
        }
      };

      // 记录API日志
      const responseTime = Date.now() - startTime;

      await billingService.logAPIRequest({
        user: req.userId,
        apiKey: req.apiKey,
        apiKeyId: req.apiKeyId,
        endpoint: '/v1/chat/completions',
        method: 'POST',
        model: model,
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens
        },
        request: {
          headers: req.headers,
          body: { model, messages: messages.length, temperature, max_tokens }
        },
        response: {
          statusCode,
          body: responseBody,
          responseTime
        },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(statusCode).json(responseBody);

    } catch (error) {
      statusCode = error.status || 500;
      errorData = {
        message: error.message,
        type: 'api_error',
        code: 'internal_error'
      };

      const responseTime = Date.now() - startTime;

      // 记录错误日志
      await billingService.logAPIRequest({
        user: req.userId,
        apiKey: req.apiKey,
        apiKeyId: req.apiKeyId,
        endpoint: '/v1/chat/completions',
        method: 'POST',
        model: req.body?.model,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        request: {
          headers: req.headers,
          body: req.body
        },
        response: {
          statusCode,
          body: errorData,
          responseTime
        },
        error: {
          message: error.message,
          code: error.code,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(statusCode).json({
        error: errorData
      });
    }
  }
);

// 文本嵌入 API
router.post('/v1/embeddings',
  authenticateAPIKey,
  requireTokenBalance,
  apiLimiter,
  async (req, res, next) => {
    const startTime = Date.now();
    let statusCode = 200;
    let responseBody = null;
    let errorData = null;

    try {
      const { model, input, encoding_format = 'float' } = req.body;

      if (!model || !input) {
        statusCode = 400;
        throw new Error('缺少必要参数: model 或 input');
      }

      const texts = Array.isArray(input) ? input : [input];
      const promptTokens = Math.ceil(texts.join(' ').length / 4);

      // 模拟嵌入向量
      const embeddings = texts.map(() => {
        return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
      });

      const totalTokens = promptTokens;

      // 计算费用
      const usage = await billingService.calculateAPIUsage(model, totalTokens, 0);

      // 扣除token
      await billingService.deductUserTokens(req.userId, usage.tokensUsed);

      responseBody = {
        object: 'list',
        data: texts.map((text, index) => ({
          object: 'embedding',
          embedding: embeddings[index],
          index: index
        })),
        model: model,
        usage: {
          prompt_tokens: totalTokens,
          total_tokens: totalTokens
        }
      };

      const responseTime = Date.now() - startTime;

      await billingService.logAPIRequest({
        user: req.userId,
        apiKey: req.apiKey,
        apiKeyId: req.apiKeyId,
        endpoint: '/v1/embeddings',
        method: 'POST',
        model: model,
        tokenUsage: {
          promptTokens: totalTokens,
          completionTokens: 0,
          totalTokens
        },
        request: {
          headers: req.headers,
          body: { model, input, encoding_format }
        },
        response: {
          statusCode,
          body: responseBody,
          responseTime
        },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(statusCode).json(responseBody);

    } catch (error) {
      statusCode = error.status || 500;
      errorData = {
        message: error.message,
        type: 'api_error',
        code: 'internal_error'
      };

      const responseTime = Date.now() - startTime;

      await billingService.logAPIRequest({
        user: req.userId,
        apiKey: req.apiKey,
        apiKeyId: req.apiKeyId,
        endpoint: '/v1/embeddings',
        method: 'POST',
        model: req.body?.model,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        request: {
          headers: req.headers,
          body: req.body
        },
        response: {
          statusCode,
          body: errorData,
          responseTime
        },
        error: {
          message: error.message,
          code: error.code
        },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(statusCode).json({
        error: errorData
      });
    }
  }
);

// 获取API状态
router.get('/status', authenticateAPIKey, async (req, res, next) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        status: 'operational',
        timestamp: new Date().toISOString(),
        user: {
          id: user._id,
          username: user.username,
          subscription: user.subscription.plan,
          tokenBalance: user.tokenBalance
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
