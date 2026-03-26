const errorHandler = (err, req, res, next) => {
  // 安全地记录错误，不暴露敏感信息
  const errorInfo = {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    statusCode: err.status || 500,
    timestamp: new Date().toISOString()
  };

  // 生产环境不记录完整堆栈到响应，只记录到服务端日志
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', errorInfo, err.stack);
  } else {
    console.error('Error:', errorInfo);
    // 不输出 err.stack 到控制台，避免日志泄露
  }

  // Mongoose验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors
    });
  }

  // Mongoose重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} 已存在`,
      field
    });
  }

  // Mongoose CastError (无效的ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: '无效的ID格式'
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '令牌已过期'
    });
  }

  // 自定义错误
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message
    });
  }

  // 默认500错误 - 生产环境永不暴露错误详情
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404处理
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
};

module.exports = {
  errorHandler,
  notFound
};
