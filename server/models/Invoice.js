const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // 关联用户
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 发票编号
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },

  // 发票类型
  type: {
    type: String,
    enum: ['subscription', 'usage', 'refund'],
    required: true
  },

  // 发票状态
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },

  // 金额信息
  currency: {
    type: String,
    default: 'CNY'
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },

  // 项目明细
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number,
    metadata: mongoose.Schema.Types.Mixed
  }],

  // 订阅信息
  subscription: {
    plan: String,
    period: {
      type: String,
      enum: ['monthly', 'yearly']
    },
    startDate: Date,
    endDate: Date
  },

  // 使用量信息
  usage: {
    tokensUsed: Number,
    billingPeriod: {
      start: Date,
      end: Date
    }
  },

  // 支付信息
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'wechat', 'alipay', 'bank_transfer'],
      default: 'stripe'
    },
    transactionId: String,
    paidAt: Date,
    failedAt: Date,
    failureReason: String
  },

  // Stripe信息
  stripe: {
    invoiceId: String,
    paymentIntentId: String,
    customerId: String
  },

  // 发票详情
  billingDetails: {
    company: String,
    name: String,
    email: String,
    address: String,
    taxId: String
  },

  // 备注
  notes: String,
  memo: String,

  // 时间戳
  dueDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 索引
invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ type: 1, createdAt: -1 });

// 生成发票编号
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // 获取本月的发票数量
    const count = await this.constructor.countDocuments({
      invoiceNumber: new RegExp(`^INV-${year}${month}`)
    });

    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// 计算总计
invoiceSchema.methods.calculateTotal = function() {
  // 计算小计
  const subtotal = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  this.subtotal = subtotal;

  // 计算总计
  this.total = this.subtotal + this.tax - this.discount;

  return this;
};

module.exports = mongoose.model('Invoice', invoiceSchema);
