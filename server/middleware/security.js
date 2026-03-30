/**
 * Security Middleware Suite
 * 防XSS、CSRF、SQL注入、CORS配置等
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');
const { body, param, query, validationResult } = require('express-validator');

// Allowed origins for CORS
const allowedOrigins = [
  'https://minduniversity.com',
  'https://www.minduniversity.com',
  'https://minduniversity.vercel.app',
  'https://minduniversity-git-master-zzx-projects.vercel.app',
  process.env.CLIENT_URL || 'http://localhost:5173'
];

// ==================== Helmet Security Headers ====================
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.github.com", "https://*.vercel.app"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
});

// ==================== CORS Configuration ====================
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400, // 24 hours
  exposedHeaders: ['X-CSRF-Token', 'X-Total-Count']
};

// ==================== Rate Limiting ====================
// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: true
});

// API rate limit based on subscription tier
const createApiRateLimiter = (subscription) => {
  const limits = {
    'Free': { max: 100, windowMs: 24 * 60 * 60 * 1000 },
    'Starter': { max: 500, windowMs: 24 * 60 * 60 * 1000 },
    'Pro': { max: 2000, windowMs: 24 * 60 * 60 * 1000 },
    'Enterprise': { max: Infinity, windowMs: 24 * 60 * 60 * 1000 }
  };
  
  const config = limits[subscription] || limits['Free'];
  
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    keyGenerator: (req) => req.userId?.toString() || req.ip,
    message: {
      error: 'API_RATE_LIMIT_EXCEEDED',
      message: `API rate limit exceeded for ${subscription} plan`
    }
  });
};

// ==================== XSS Prevention ====================
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    allowedIframeHostnames: [],
    textFilter: (text) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  });
};

const sanitizeBody = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return sanitizeInput(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// ==================== Input Validation ====================
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      details: errors.array()
    });
  }
  next();
};

// Validation rules
const validationRules = {
  email: (field) => body(field)
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isEmail().withMessage(`${field} must be a valid email`)
    .normalizeEmail(),
  
  password: (field) => body(field)
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isLength({ min: 8, max: 128 }).withMessage(`${field} must be 8-128 characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage(`${field} must contain uppercase, lowercase, and numbers`),
  
  username: (field) => body(field)
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isLength({ min: 3, max: 30 }).withMessage(`${field} must be 3-30 characters`)
    .matches(/^[a-zA-Z0-9_]+$/).withMessage(`${field} can only contain letters, numbers, and underscores`),
  
  mongoId: (field) => param(field)
    .notEmpty().withMessage(`${field} is required`)
    .isMongoId().withMessage(`${field} must be a valid MongoDB ID`),
  
  string: (field, options = {}) => body(field)
    .optional()
    .trim()
    .isString()
    .isLength({ min: options.min || 0, max: options.max || 1000 }),
  
  number: (field, options = {}) => body(field)
    .optional()
    .isInt({ min: options.min, max: options.max }),
  
  boolean: (field) => body(field)
    .optional()
    .isBoolean()
    .toBoolean(),
  
  date: (field) => body(field)
    .optional()
    .isISO8601()
    .toDate()
};

// ==================== SQL Injection Prevention ====================
const preventSqlInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|UNION|EXEC|EXECUTE)\b)/i,
    /(\'|\"|;|\-\-|\/\*|\*\/|xp_|sp_)/i,
    /(\bOR\b|\bAND\b).*=.*(\=|<|>|!=)/i
  ];
  
  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    return sqlPatterns.some(pattern => pattern.test(str));
  };
  
  const checkObject = (obj) => {
    for (const key in obj) {
      if (checkString(obj[key]) || checkString(key)) {
        return true;
      }
    }
    return false;
  };
  
  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      message: 'Invalid characters detected'
    });
  }
  
  next();
};

// ==================== CSRF Protection ====================
const csrfProtection = (req, res, next) => {
  const token = req.get('X-CSRF-Token') || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      error: 'CSRF_TOKEN_MISSING_OR_INVALID',
      message: 'CSRF token validation failed'
    });
  }
  
  next();
};

const generateCsrfToken = (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex');
  req.session = req.session || {};
  req.session.csrfToken = token;
  res.set('X-CSRF-Token', token);
  next();
};

// ==================== Authentication ====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token required'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    });
  }
};

// ==================== Permission Check ====================
const checkPermission = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// ==================== IP Whitelist (Optional) ====================
const ipWhitelist = (whitelist = []) => {
  return (req, res, next) => {
    if (whitelist.length === 0) return next();
    
    const ip = req.ip || req.connection.remoteAddress;
    if (!whitelist.includes(ip)) {
      return res.status(403).json({
        error: 'IP_NOT_ALLOWED',
        message: 'Access denied from this IP'
      });
    }
    next();
  };
};

// ==================== Error Handler ====================
const errorHandler = (err, req, res, next) => {
  console.error('Security error:', err);
  
  // CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'CSRF_TOKEN_INVALID',
      message: 'Invalid CSRF token'
    });
  }
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS_ERROR',
      message: 'Cross-origin request not allowed'
    });
  }
  
  // Default error
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
};

// ==================== Logging ====================
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      ip: req.ip,
      statusCode: res.statusCode,
      duration,
      userId: req.userId,
      userAgent: req.get('user-agent')
    };
    
    // Log security events
    if (res.statusCode >= 400) {
      console.warn('Security event:', JSON.stringify(logData));
    }
  });
  
  next();
};

module.exports = {
  securityHeaders,
  corsOptions,
  apiLimiter,
  authLimiter,
  createApiRateLimiter,
  sanitizeInput,
  sanitizeBody,
  validateRequest,
  validationRules,
  preventSqlInjection,
  csrfProtection,
  generateCsrfToken,
  authenticateToken,
  checkPermission,
  ipWhitelist,
  errorHandler,
  securityLogger
};
