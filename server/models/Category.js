const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,

  // 分类层级
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  level: {
    type: Number,
    default: 0
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],

  // 图标和颜色
  icon: String,
  color: String,
  thumbnail: String,

  // 排序
  order: {
    type: Number,
    default: 0
  },

  // 统计
  courseCount: {
    type: Number,
    default: 0
  },
  studentCount: {
    type: Number,
    default: 0
  },

  // 状态
  isActive: {
    type: Boolean,
    default: true
  },

  // SEO
  metaTitle: String,
  metaDescription: String,

  // 时间戳
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
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, order: 1 });
categorySchema.index({ isActive: 1, order: 1 });

// 生成slug
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// 更新课程数
categorySchema.methods.updateCourseCount = async function() {
  const Course = mongoose.model('Course');
  const count = await Course.countDocuments({ category: this._id, status: 'published' });
  this.courseCount = count;
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema);
