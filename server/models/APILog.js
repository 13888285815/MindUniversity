const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  // 关联用户
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  apiKey: {
    type: String,
    required: true
  },
  apiKeyId: String,

  // 请求信息
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  model: String,

  // Token消耗
  tokenUsage: {
    promptTokens: {
      type: Number,
      default: 0
    },
    completionTokens: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      required: true
    }
  },

  // 请求元数据 (不存储body和headers，只存元信息)
  request: {
    query: Object
  },

  // 响应元数据 (不存储body)
  response: {
    statusCode: Number,
    responseTime: Number // 毫秒
  },

  // 错误信息 (不存储stack)
  error: {
    message: String,
    code: String
  },

  // 元数据
  ip: String,
  userAgent: String,

  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 索引
apiLogSchema.index({ user: 1, createdAt: -1 });
apiLogSchema.index({ apiKey: 1, createdAt: -1 });
apiLogSchema.index({ endpoint: 1, createdAt: -1 });
apiLogSchema.index({ createdAt: -1 });

// 复合索引用于统计查询
apiLogSchema.index({ user: 1, createdAt: 1 }, { name: 'user_date_index' });

// 静态方法:获取用户指定时间段的token使用量
apiLogSchema.statics.getUserTokenUsage = async function(userId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: '$tokenUsage.totalTokens' },
        promptTokens: { $sum: '$tokenUsage.promptTokens' },
        completionTokens: { $sum: '$tokenUsage.completionTokens' },
        requestCount: { $sum: 1 },
        avgResponseTime: { $avg: '$response.responseTime' }
      }
    }
  ]);

  return result[0] || {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    requestCount: 0,
    avgResponseTime: 0
  };
};

// 静态方法:获取热门端点
apiLogSchema.statics.getPopularEndpoints = async function(limit = 10) {
  const result = await this.aggregate([
    {
      $group: {
        _id: '$endpoint',
        count: { $sum: 1 },
        totalTokens: { $sum: '$tokenUsage.totalTokens' },
        avgResponseTime: { $avg: '$response.responseTime' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return result.map(item => ({
    endpoint: item._id,
    requestCount: item.count,
    totalTokens: item.totalTokens,
    avgResponseTime: item.avgResponseTime
  }));
};

// 静态方法:获取错误率统计
apiLogSchema.statics.getErrorRate = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        errorRequests: {
          $sum: {
            $cond: [{ $ne: ['$error.message', null] }, 1, 0]
          }
        }
      }
    }
  ]);

  if (result.length === 0) {
    return { totalRequests: 0, errorRequests: 0, errorRate: 0 };
  }

  const { totalRequests, errorRequests } = result[0];
  return {
    totalRequests,
    errorRequests,
    errorRate: totalRequests > 0 ? (errorRequests / totalRequests * 100).toFixed(2) : 0
  };
};

module.exports = mongoose.model('APILog', apiLogSchema);
