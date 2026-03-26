const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  videoUrl: {
    type: String,
    required: true
  },
  duration: Number, // 秒
  thumbnail: String,
  order: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  resources: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'zip', 'code', 'other']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const courseSchema = new mongoose.Schema({
  // 基本信息
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: String,
  description: {
    type: String,
    required: true
  },

  // 分类信息
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  tags: [String],

  // 教师信息
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructorName: String,

  // 封面和媒体
  thumbnail: String,
  trailerVideo: String,

  // 价格和订阅
  pricing: {
    type: {
      type: String,
      enum: ['free', 'paid', 'subscription'],
      default: 'paid'
    },
    price: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'CNY'
    }
  },

  // 订阅要求
  requiredPlan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },

  // 课程内容
  lessons: [lessonSchema],
  totalLessons: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  },

  // 难度级别
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },

  // 语言
  language: {
    type: String,
    default: 'zh-CN'
  },

  // 统计信息
  stats: {
    enrollmentCount: {
      type: Number,
      default: 0
    },
    completedCount: {
      type: Number,
      default: 0
    },
    totalWatchTime: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },

  // 状态
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // 发布信息
  publishedAt: Date
});

// 索引
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ 'pricing.type': 1 });
courseSchema.index({ createdAt: -1 });

// 更新课程统计
courseSchema.methods.updateStats = async function() {
  // 计算总课程数和总时长
  this.totalLessons = this.lessons.length;
  this.totalDuration = this.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);

  return this.save();
};

// 计算平均评分
courseSchema.methods.calculateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const result = await Review.aggregate([
    { $match: { course: this._id } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  if (result.length > 0) {
    this.stats.averageRating = result[0].averageRating;
    this.stats.reviewCount = result[0].count;
  }

  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);
