const express = require('express');
const router = express.Router();
const { Course, Category, Review } = require('../models');
const { authenticateJWT, requireSubscription } = require('../middleware/auth');

// 获取所有分类
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .populate('parent', 'name slug')
      .lean();

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
});

// 获取课程列表
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      difficulty,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = { status: 'published' };

    // 分类筛选
    if (category) {
      query.category = category;
    }

    // 难度筛选
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // 搜索
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // 排序
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category', 'name slug')
        .populate('instructor', 'username profile.fullName profile.avatar')
        .lean(),

      Course.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取课程详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('category', 'name slug')
      .populate('instructor', 'username profile.fullName profile.avatar profile.bio')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    next(error);
  }
});

// 获取课程章节
router.get('/:id/lessons', async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    // 根据用户订阅计划决定返回哪些课程
    const lessons = course.lessons.map(lesson => ({
      ...lesson,
      isLocked: !lesson.isFree && req.user?.subscription?.plan === 'free'
    }));

    res.json({
      success: true,
      data: {
        lessons,
        totalLessons: course.totalLessons,
        totalDuration: course.totalDuration
      }
    });
  } catch (error) {
    next(error);
  }
});

// 更新学习进度
router.post('/:id/progress', authenticateJWT, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lessonId, progress } = req.body;

    const user = req.user;

    // 查找或创建课程学习记录
    const enrollmentIndex = user.enrolledCourses.findIndex(
      e => e.courseId.toString() === id
    );

    if (enrollmentIndex === -1) {
      // 新加入课程
      user.enrolledCourses.push({
        courseId: id,
        progress: progress || 0,
        completedLessons: lessonId ? [lessonId] : []
      });
    } else {
      // 更新进度
      user.enrolledCourses[enrollmentIndex].progress = progress || user.enrolledCourses[enrollmentIndex].progress;
      user.enrolledCourses[enrollmentIndex].lastWatchedAt = new Date();

      if (lessonId && !user.enrolledCourses[enrollmentIndex].completedLessons.includes(lessonId)) {
        user.enrolledCourses[enrollmentIndex].completedLessons.push(lessonId);
      }
    }

    await user.save();

    res.json({
      success: true,
      message: '进度已更新',
      data: {
        progress: progress,
        completedLessons: user.enrolledCourses[enrollmentIndex]?.completedLessons || []
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取学习进度
router.get('/:id/progress', authenticateJWT, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const enrollment = user.enrolledCourses.find(
      e => e.courseId.toString() === id
    );

    if (!enrollment) {
      return res.json({
        success: true,
        data: {
          progress: 0,
          completedLessons: [],
          isEnrolled: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        lastWatchedAt: enrollment.lastWatchedAt,
        isEnrolled: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取课程评价
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

    const query = { course: id, isVisible: true };
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'username profile.fullName profile.avatar')
        .lean(),

      Review.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 添加课程评价
router.post('/:id/reviews', authenticateJWT, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, isRecommended } = req.body;

    // 检查是否已经评价过
    const existingReview = await Review.findOne({
      course: id,
      user: req.userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '您已经评价过此课程'
      });
    }

    const review = await Review.create({
      course: id,
      user: req.userId,
      rating,
      title,
      comment,
      isRecommended
    });

    // 更新课程评分
    const course = await Course.findById(id);
    await course.calculateAverageRating();

    res.status(201).json({
      success: true,
      message: '评价成功',
      data: { review }
    });
  } catch (error) {
    next(error);
  }
});

// 获取热门课程
router.get('/featured/popular', async (req, res, next) => {
  try {
    const courses = await Course.find({ status: 'published' })
      .sort({ 'stats.enrollmentCount': -1 })
      .limit(10)
      .populate('category', 'name slug')
      .populate('instructor', 'username profile.fullName')
      .lean();

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    next(error);
  }
});

// 获取最新课程
router.get('/featured/newest', async (req, res, next) => {
  try {
    const courses = await Course.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('category', 'name slug')
      .populate('instructor', 'username profile.fullName')
      .lean();

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    next(error);
  }
});

// 获取推荐课程 (根据用户学习历史)
router.get('/featured/recommended', authenticateJWT, async (req, res, next) => {
  try {
    const user = req.user;

    // 获取用户已学习的课程分类
    const learnedCategories = user.enrolledCourses.map(e => e.courseId);

    // 推荐相似分类的课程
    const courses = await Course.find({
      status: 'published',
      _id: { $nin: learnedCategories }
    })
      .sort({ 'stats.averageRating': -1 })
      .limit(10)
      .populate('category', 'name slug')
      .populate('instructor', 'username profile.fullName')
      .lean();

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
