const mongoose = require('mongoose');

// AI 分析报告 Schema
const aiAnalysisSchema = new mongoose.Schema({
  // 关联
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    index: true
  },
  symbol: {
    type: String,
    required: true,
    index: true
  },
  market: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  // 分析类型 (technical/fundamental/comprehensive/risk/portfolio)
  type: {
    type: String,
    enum: ['technical', 'fundamental', 'comprehensive', 'risk', 'portfolio'],
    required: true
  },
  // 分析标题
  title: String,
  // 综合评分 (0-100)
  score: {
    overall: Number,
    technical: Number,
    fundamental: Number,
    risk: Number,
    sentiment: Number
  },
  // 信号
  signal: {
    type: String,
    enum: ['strong_buy', 'buy', 'neutral', 'sell', 'strong_sell'],
    default: 'neutral'
  },
  // 目标价
  targetPrice: Number,
  stopLoss: Number,
  // 分析内容
  summary: String,
  analysis: {
    technical: String,      // 技术分析
    fundamental: String,     // 基本面分析
    riskAssessment: String,  // 风险评估
    marketContext: String,   // 市场环境
    recommendation: String  // 操作建议
  },
  // 关键指标
  keyIndicators: [{
    name: String,
    value: String,
    signal: String
  }],
  // Token 消耗
  tokensUsed: {
    prompt: Number,
    completion: Number,
    total: Number
  },
  // 耗时
  processingTime: Number,
  // AI模型
  model: String,
  // 版本/时间戳
  version: { type: String, default: '1.0' },
  expiresAt: Date
}, { timestamps: true });

// 索引
aiAnalysisSchema.index({ symbol: 1, type: 1, createdAt: -1 });
aiAnalysisSchema.index({ user: 1, createdAt: -1 });
aiAnalysisSchema.index({ signal: 1 });

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
