const axios = require('axios');

class AIService {
  /**
   * General AI chat completion using OpenAI-compatible API
   * @param {Array} messages - Chat messages [{ role, content }]
   * @param {Object} options - { maxTokens, temperature, model }
   * @returns {Object} - { content, tokensUsed, model }
   */
  async chatCompletion(messages, options = {}) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 未配置');
    }

    const model = options.model || process.env.AI_MODEL || 'gpt-3.5-turbo';
    const maxTokens = options.maxTokens || parseInt(process.env.AI_MAX_TOKENS) || 4096;
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages,
          max_tokens: maxTokens,
          temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const choice = response.data.choices?.[0];
      return {
        content: choice?.message?.content || '',
        tokensUsed: response.data.usage?.total_tokens || 0,
        model: response.data.model || model
      };
    } catch (error) {
      if (error.response) {
        console.error('OpenAI API error:', error.response.status, error.response.data);
      } else {
        console.error('OpenAI API request failed:', error.message);
      }
      throw new Error('AI 服务调用失败');
    }
  }
}

module.exports = new AIService();
