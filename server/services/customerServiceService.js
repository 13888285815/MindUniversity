const aiService = require('../services/aiService');

class CustomerServiceService {
  /**
   * 处理智能客服对话
   */
  async processCustomerMessage(userId, message, conversationHistory = []) {
    try {
      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt();

      // 添加对话历史
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      // 调用 AI 服务
      const response = await aiService.chatCompletion(messages, {
        maxTokens: 1000,
        temperature: 0.7
      });

      return {
        success: true,
        reply: response.content,
        tokensUsed: response.tokensUsed,
        model: response.model
      };
    } catch (error) {
      console.error('Customer service error:', error);
      throw new Error('智能客服服务暂时不可用，请稍后再试');
    }
  }

  /**
   * 构建系统提示词
   */
  buildSystemPrompt() {
    return `你是意念科技在线学习平台的智能客服助手。你的职责是：

1. **平台介绍**：介绍平台的核心功能和优势
2. **订阅咨询**：解答关于订阅计划、价格、功能权限的问题
3. **技术支持**：帮助用户解决使用中遇到的技术问题
4. **账单查询**：协助用户查询订阅和账单信息
5. **使用指导**：提供平台各项功能的使用指导

**平台核心功能**：
- 实时行情数据（K线、分时、五档盘口）
- AI 智能分析（个股诊断、技术指标）
- 自选股管理和预警系统
- 订阅计划（Free/Starter/Pro/Enterprise）
- API Tokens 计费系统

**订阅计划价格**：
- Free：免费（20自选股、5预警、延迟15分钟行情）
- Starter：¥49/月（50自选股、20预警、实时行情）
- Pro：¥199/月（200自选股、100预警、高级AI模型）
- Enterprise：¥999/月（无限使用、专属支持）

**回答规则**：
1. 使用友好、专业的语气
2. 回答要简洁明了，突出重点
3. 如果遇到无法回答的问题，建议用户联系邮箱：zzx@yndxw.com
4. 推荐高级功能时，说明其价值和适合的用户群体
5. 保持积极、乐于助人的态度

**重要提示**：
- 不要提供股票买卖建议或投资建议
- 所有数据仅供参考，不构成投资决策依据
- 提醒用户注意投资风险

现在，请作为意念科技的智能客服助手，回答用户的问题。`;
  }

  /**
   * 获取常见问题列表
   */
  getFAQ() {
    return [
      {
        category: '订阅相关',
        questions: [
          {
            question: '如何选择合适的订阅计划？',
            answer: '新手建议从 Free 计划开始体验，如果需要实时行情和更多功能，可以选择 Starter（¥49/月）。专业投资者推荐 Pro（¥199/月），企业用户推荐 Enterprise（¥999/月）。'
          },
          {
            question: '可以随时取消订阅吗？',
            answer: '是的，您可以随时在"订阅计划"页面取消订阅。取消后将继续享受当前订阅周期的剩余时间，不会立即停止服务。'
          },
          {
            question: '升级订阅如何计费？',
            answer: '升级订阅会按剩余天数比例补差价。例如从 Starter 升级到 Pro，系统会自动计算费用并扣除相应金额。'
          }
        ]
      },
      {
        category: '功能使用',
        questions: [
          {
            question: '如何添加自选股？',
            answer: '在"自选股"页面点击"添加自选股"按钮，输入股票代码或名称即可。Free 用户最多可添加 20 只，Starter 50 只，Pro 200 只，Enterprise 无限制。'
          },
          {
            question: 'AI 分析功能如何使用？',
            answer: '在个股详情页点击"AI 分析"按钮，系统会从技术面、基本面、风险和情绪四个维度进行综合评分。Free 用户每天可使用 3 次，Starter 20 次，Pro 100 次。'
          },
          {
            question: '如何设置价格预警？',
            answer: '在"预警管理"页面点击"创建预警"，设置预警条件和触发方式。当价格达到设定值时，系统会实时通知您。Free 用户最多 5 个，Starter 20 个，Pro 100 个。'
          }
        ]
      },
      {
        category: 'API 和账单',
        questions: [
          {
            question: '如何使用 API？',
            answer: '在"API Keys"页面创建 API Key，然后使用 OpenAI 兼容的接口调用。API 调用会从您的 Token 余额中扣除。Starter 用户每天最多 1,000 次调用，Pro 10,000 次。'
          },
          {
            question: '如何查询账单明细？',
            answer: '在"账单明细"页面可以查看所有消费记录、订阅缴费、API 调用等详细信息。支持按日期筛选和导出。'
          },
          {
            question: 'Token 如何计费？',
            answer: '每次 API 调用会根据使用的 Token 数量计费。不同 AI 模型的计费标准不同，详情请查看 API 文档。您可以在"账单明细"中查看每次调用的具体费用。'
          }
        ]
      },
      {
        category: '账户管理',
        questions: [
          {
            question: '如何修改密码？',
            answer: '在"个人中心"页面点击"修改密码"，输入当前密码和新密码即可。建议定期更换密码以保障账户安全。'
          },
          {
            question: '忘记密码怎么办？',
            answer: '在登录页点击"忘记密码"，输入注册邮箱，系统会发送重置密码链接到您的邮箱。'
          },
          {
            question: '如何注销账户？',
            answer: '如需注销账户，请联系客服邮箱 zzx@yndxw.com。注销后所有数据将被删除且无法恢复。'
          }
        ]
      },
      {
        category: '数据说明',
        questions: [
          {
            question: '数据延迟多久？',
            answer: 'Free 用户行情延迟 15 分钟，Starter/Pro/Enterprise 用户可享受实时行情（具体取决于您的订阅计划）。'
          },
          {
            question: '数据准确吗？',
            answer: '我们的数据来自权威市场数据提供商，经过严格的质量控制。但所有数据仅供参考，不构成投资建议，投资需谨慎。'
          },
          {
            question: '支持哪些股票市场？',
            answer: '目前支持 A 股市场（沪深两市），未来将逐步扩展到港股、美股等其他市场。'
          }
        ]
      }
    ];
  }

  /**
   * 根据关键词获取快速回复
   */
  getQuickReply(keyword) {
    const quickReplies = {
      '价格': '我们的订阅计划价格：Free（免费）、Starter（¥49/月）、Pro（¥199/月）、Enterprise（¥999/月）。点击"订阅计划"查看详细功能对比。',
      '订阅': '选择"订阅计划"页面可以查看所有订阅等级的功能对比和价格。可以随时升级或取消。',
      '免费': 'Free 计划完全免费，包含 20 个自选股、5 个预警、延迟 15 分钟行情和每天 3 次 AI 分析。适合新手体验。',
      '实时': 'Starter 及以上订阅计划可享受实时行情数据，包括实时报价、五档盘口等。',
      'API': '在"API Keys"页面创建 API Key，使用 OpenAI 兼容接口调用。Starter 每天 1,000 次，Pro 每天 10,000 次。',
      '账单': '在"账单明细"页面可以查看所有消费记录，包括订阅缴费、API 调用等。',
      '密码': '在"个人中心"页面可以修改密码。如果忘记密码，在登录页点击"忘记密码"重置。',
      '预警': '在"预警管理"页面可以创建价格预警，触发时会实时通知您。Free 最多 5 个，Starter 20 个，Pro 100 个。',
      '自选': '在"自选股"页面可以添加和管理自选股。Free 最多 20 个，Starter 50 个，Pro 200 个。',
      'AI': '在个股详情页点击"AI 分析"按钮可以获得多维度分析报告。Free 每天 3 次，Starter 20 次，Pro 100 次。',
      '联系': '如需人工客服，请发送邮件至 zzx@yndxw.com，我们会尽快回复。',
      '风险': '所有数据仅供参考，不构成投资建议。投资有风险，入市需谨慎。',
      '企业': 'Enterprise 计划（¥999/月）提供无限使用、专属技术支持和定制化服务，适合团队和企业用户。'
    };

    for (const key in quickReplies) {
      if (keyword.includes(key)) {
        return quickReplies[key];
      }
    }

    return null;
  }
}

module.exports = new CustomerServiceService();
