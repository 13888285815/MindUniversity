const { AIAnalysis, Stock, User } = require('../models');
const billingService = require('./billingService');
const mongoose = require('mongoose');

class AIAnalysisService {
  // 生成AI分析
  async analyzeStock(userId, symbol, market, type = 'comprehensive') {
    const user = await User.findById(userId);
    if (!user) throw new Error('用户不存在');

    // 检查订阅权限
    if (!user.subscription.features.advancedChart && type !== 'technical') {
      throw new Error('当前订阅计划不支持此分析类型，请升级到Pro计划');
    }

    // 检查每日分析次数
    if (!user.canDoAIAnalysis()) {
      throw new Error(`今日AI分析次数已用完(${user.subscription.features.aiAnalysisPerDay}次/天)，请明天再试或升级订阅`);
    }

    // 获取股票数据
    const stock = await Stock.findOne({ symbol, market });
    if (!stock) throw new Error('股票不存在');

    const startTime = Date.now();
    
    // 获取行情数据
    const klines = await require('./marketDataService').getKlineData(symbol, market, 'day', 120);
    const recentKlines = klines.slice(-30);
    
    // 构建分析prompt
    const prompt = this.buildAnalysisPrompt(stock, recentKlines, type);

    try {
      // 调用AI (模拟响应，实际应调用OpenAI/其他LLM)
      const analysis = this.generateMockAnalysis(stock, recentKlines, type);
      
      const tokensUsed = {
        prompt: Math.ceil(prompt.length / 4),
        completion: Math.ceil(JSON.stringify(analysis).length / 4),
        total: 0
      };
      tokensUsed.total = tokensUsed.prompt + tokensUsed.completion;

      // 扣除Token
      await billingService.deductUserTokens(userId, tokensUsed.total);
      
      // 更新每日计数
      user.dailyAIAnalysisCount += 1;
      user.lastAIAnalysisDate = new Date();
      await user.save();

      // 保存分析记录
      const record = await AIAnalysis.create({
        stock: stock._id,
        symbol,
        market,
        user: userId,
        type,
        title: `${stock.name}(${symbol}) ${this.getTypeName(type)}`,
        score: analysis.score,
        signal: analysis.signal,
        targetPrice: analysis.targetPrice,
        stopLoss: analysis.stopLoss,
        summary: analysis.summary,
        analysis: analysis.details,
        keyIndicators: analysis.indicators,
        tokensUsed,
        processingTime: Date.now() - startTime,
        model: process.env.AI_MODEL || 'gpt-4'
      });

      return record;
    } catch (error) {
      throw new Error(`AI分析失败: ${error.message}`);
    }
  }

  // 获取分析历史
  async getAnalysisHistory(userId, { page = 1, limit = 10, symbol, type } = {}) {
    const query = { user: userId };
    if (symbol) query.symbol = symbol;
    if (type) query.type = type;

    const [records, total] = await Promise.all([
      AIAnalysis.find(query)
        .populate('stock', 'symbol name market quote')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      AIAnalysis.countDocuments(query)
    ]);

    return {
      analyses: records,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    };
  }

  // 获取单条分析
  async getAnalysis(analysisId, userId) {
    const analysis = await AIAnalysis.findOne({ _id: analysisId, user: userId })
      .populate('stock', 'symbol name market quote')
      .lean();
    if (!analysis) throw new Error('分析记录不存在');
    return analysis;
  }

  // 删除分析
  async deleteAnalysis(analysisId, userId) {
    const result = await AIAnalysis.deleteOne({ _id: analysisId, user: userId });
    if (result.deletedCount === 0) throw new Error('分析记录不存在');
  }

  // 构建分析Prompt
  buildAnalysisPrompt(stock, klines, type) {
    const recent = klines.slice(-10);
    const klineData = recent.map(k => 
      `日期:${k.date} 开:${k.open} 高:${k.high} 低:${k.low} 收:${k.close} 量:${k.volume} 涨跌:${k.changePercent}%`
    ).join('\n');

    return `你是一位专业的证券分析师，请对以下股票进行${this.getTypeName(type)}分析。

股票: ${stock.name}(${stock.symbol}) 市场:${stock.market}
行业: ${stock.sector || '未知'}
最新价: ${stock.quote?.price || 'N/A'}
市盈率: ${stock.fundamentals?.pe || 'N/A'}
市净率: ${stock.fundamentals?.pb || 'N/A'}

近期K线数据:
${klineData}

请提供:
1. 综合评分(0-100)
2. 交易信号(strong_buy/buy/neutral/sell/strong_sell)
3. 目标价和止损价
4. 简要总结(200字内)
5. 技术分析
6. 基本面分析
7. 风险评估
8. 操作建议
9. 关键指标信号`;
  }

  // 生成模拟分析
  generateMockAnalysis(stock, klines, type) {
    const lastKline = klines[klines.length - 1];
    const prevKline = klines[klines.length - 2];
    const price = stock.quote?.price || lastKline?.close || 10;
    
    const trend = lastKline?.close > prevKline?.close ? 'up' : 'down';
    const ma5 = lastKline?.ma5 || price;
    const ma20 = lastKline?.ma20 || price;
    const ma60 = lastKline?.ma60 || price;
    
    let technicalScore = 50;
    let fundamentalScore = 50;
    let riskScore = 50;
    let sentimentScore = 50;

    if (trend === 'up') { technicalScore += 15; sentimentScore += 10; }
    if (price > ma5) technicalScore += 10;
    if (price > ma20) technicalScore += 8;
    if (price > ma60) technicalScore += 5;
    if (stock.fundamentals?.pe && stock.fundamentals.pe < 30) fundamentalScore += 15;
    if (stock.fundamentals?.roe && stock.fundamentals.roe > 15) fundamentalScore += 10;

    const overallScore = Math.min(100, Math.max(0,
      Math.round(technicalScore * 0.4 + fundamentalScore * 0.3 + sentimentScore * 0.15 + riskScore * 0.15)
    ));

    let signal = 'neutral';
    if (overallScore >= 80) signal = 'strong_buy';
    else if (overallScore >= 65) signal = 'buy';
    else if (overallScore >= 40) signal = 'neutral';
    else if (overallScore >= 25) signal = 'sell';
    else signal = 'strong_sell';

    const targetUp = 1 + (Math.random() * 0.15 + 0.05);
    const targetDown = 1 - (Math.random() * 0.08 + 0.03);

    return {
      score: { overall: overallScore, technical: technicalScore, fundamental: fundamentalScore, risk: riskScore, sentiment: sentimentScore },
      signal,
      targetPrice: parseFloat((price * targetUp).toFixed(2)),
      stopLoss: parseFloat((price * targetDown).toFixed(2)),
      summary: `${stock.name}当前趋势${trend === 'up' ? '向好' : '偏弱'}，技术面${technicalScore > 60 ? '表现较强' : '需要关注'}。短期支撑位在MA5附近，阻力位关注前高。建议${signal === 'buy' || signal === 'strong_buy' ? '逢低布局' : '观望为主'}，严格控制仓位。`,
      details: {
        technical: `价格${price > ma5 ? '站上' : '跌破'}5日均线(${ma5.toFixed(2)})，${price > ma20 ? '站上' : '跌破'}20日均线(${ma20.toFixed(2)})。成交量${klines.slice(-5).reduce((s, k) => s + k.volume, 0) > klines.slice(-10, -5).reduce((s, k) => s + k.volume, 0) ? '放大' : '萎缩'}，市场参与度${trend === 'up' ? '提升' : '下降'}。MACD指标在零轴${trend === 'up' ? '上方' : '下方'}，KDJ呈现${trend === 'up' ? '金叉' : '死叉'}信号。`,
        fundamental: `市盈率${stock.fundamentals?.pe ? stock.fundamentals.pe.toFixed(1) : 'N/A'}倍，市净率${stock.fundamentals?.pb ? stock.fundamentals.pb.toFixed(1) : 'N/A'}倍。ROE为${stock.fundamentals?.roe ? stock.fundamentals.roe.toFixed(1) : 'N/A'}%，盈利能力${stock.fundamentals?.roe > 15 ? '优秀' : '一般'}。营收增长${stock.fundamentals?.revenueGrowth ? stock.fundamentals.revenueGrowth.toFixed(1) : 'N/A'}%，净利润增长${stock.fundamentals?.profitGrowth ? stock.fundamentals.profitGrowth.toFixed(1) : 'N/A'}%。`,
        riskAssessment: `风险等级${overallScore > 70 ? '中低' : overallScore > 40 ? '中等' : '偏高'}。主要风险点: 1)市场系统性风险; 2)行业政策变动; 3)个股业绩不及预期。建议设置止损位，单只股票仓位不超过总资金的20%。`,
        marketContext: `当前大盘${Math.random() > 0.5 ? '震荡上行' : '调整蓄势'}，市场情绪${Math.random() > 0.5 ? '偏乐观' : '谨慎'}。${stock.sector || '该板块'}板块近期${Math.random() > 0.5 ? '表现活跃' : '相对平淡'}，北向资金${Math.random() > 0.5 ? '持续流入' : '有所流出'}。`,
        recommendation: `${signal === 'buy' || signal === 'strong_buy' ? '建议逢低分批建仓，目标价' + (price * targetUp).toFixed(2) + '元，止损位' + (price * targetDown).toFixed(2) + '元' : signal === 'sell' || signal === 'strong_sell' ? '建议减仓或离场观望，等待更好的入场时机' : '建议持股观望，关注均线支撑和成交量变化'}。关注量价配合和板块轮动节奏。`
      },
      indicators: [
        { name: 'MA5', value: ma5.toFixed(2), signal: price > ma5 ? '看多' : '看空' },
        { name: 'MA20', value: ma20.toFixed(2), signal: price > ma20 ? '看多' : '看空' },
        { name: 'MA60', value: ma60.toFixed(2), signal: price > ma60 ? '看多' : '看空' },
        { name: 'PE', value: stock.fundamentals?.pe?.toFixed(1) || 'N/A', signal: (stock.fundamentals?.pe || 50) < 30 ? '低估' : '合理' },
        { name: 'ROE', value: stock.fundamentals?.roe?.toFixed(1) + '%' || 'N/A', signal: (stock.fundamentals?.roe || 10) > 15 ? '优秀' : '一般' },
        { name: '换手率', value: (stock.quote?.turnover || 0).toFixed(2) + '%', signal: (stock.quote?.turnover || 0) > 5 ? '活跃' : '正常' }
      ]
    };
  }

  getTypeName(type) {
    const names = {
      technical: '技术分析',
      fundamental: '基本面分析',
      comprehensive: '综合分析',
      risk: '风险评估',
      portfolio: '组合分析'
    };
    return names[type] || type;
  }
}

module.exports = new AIAnalysisService();
