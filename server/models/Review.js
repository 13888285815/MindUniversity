const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // 关联
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 评分
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // 评价内容
  title: String,
  comment: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // 课程进度
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // 推荐标记
  isRecommended: {
    type: Boolean,
    default: false
  },

  // 点赞
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },

  // 回复
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // 状态
  isVerified: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  },

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
reviewSchema.index({ course: 1, createdAt: -1 });
reviewSchema.index({ user: 1, course: 1 }, { unique: true }); // 每个用户对每门课程只能评价一次
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isVisible: 1, createdAt: -1 });

// 静态方法:获取课程平均评分
reviewSchema.statics.getCourseRating = async function(courseId) {
  const result = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1,
        rating5: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 5] }
            }
          }
        },
        rating4: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 4] }
            }
          }
        },
        rating3: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 3] }
            }
          }
        },
        rating2: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 2] }
            }
          }
        },
        rating1: {
          $size: {
            $filter: {
              input: '$ratingDistribution',
              as: 'rating',
              cond: { $eq: ['$$rating', 1] }
            }
          }
        }
      }
    }
  ]);

  return result[0] || {
    averageRating: 0,
    totalReviews: 0,
    rating5: 0,
    rating4: 0,
    rating3: 0,
    rating2: 0,
    rating1: 0
  };
};

module.exports = mongoose.model('Review', reviewSchema);
