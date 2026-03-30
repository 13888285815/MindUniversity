// ==================== UI 美化增强脚本 ====================

// 添加动态效果和视觉优化
const enhancedStyles = `
<style>
/* ==================== 动画效果 ==================== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 课程卡片悬停效果增强 */
.course-card {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.course-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.2),
    transparent
  );
  transition: left 0.6s;
}

.course-card:hover::before {
  left: 100%;
}

.course-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

/* 播放按钮动画 */
.play-btn {
  animation: pulse 2s ease-in-out infinite;
}

.course-card:hover .play-btn {
  transform: scale(1.3);
  background: rgba(25, 100, 191, 0.9);
}

/* 轮播图动画优化 */
.carousel-slide {
  animation: fadeIn 0.6s ease-out;
}

/* 按钮美化 */
button, .btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

button::after, .btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

button:active::after, .btn:active::after {
  width: 300px;
  height: 300px;
}

.btn-vip {
  background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%) !important;
  box-shadow: 0 4px 15px rgba(255, 140, 0, 0.3);
}

.btn-vip:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 140, 0, 0.4);
}

/* 分类图标动画 */
.cat-icon {
  transition: transform 0.3s ease;
}

.cat-bar li:hover .cat-icon {
  animation: float 0.6s ease-in-out;
}

/* Toast 消息美化 */
.toast {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  border: none;
  animation: slideInDown 0.5s ease-out;
  backdrop-filter: blur(10px);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 模态框美化 */
.modal {
  animation: modalFadeIn 0.3s ease-out;
  box-shadow: 0 25px 80px rgba(0,0,0,0.3);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 课程详情模态框 */
.course-detail-header {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  border-radius: 12px 12px 0 0;
}

/* 视频播放器美化 */
.video-player-container {
  box-shadow: 0 30px 100px rgba(0,0,0,0.5);
}

#mainVideo {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

/* 章节列表美化 */
.chapter-item {
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chapter-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.chapter-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  font-weight: 600;
}

/* 课程列表项美化 */
.lesson-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lesson-item:hover {
  background: #fff;
  padding-left: 24px;
}

.lesson-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  margin-right: 12px;
}

.lesson-free {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.lesson-lock {
  color: #6c757d;
  background: #e9ecef;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

/* 搜索框美化 */
.search-box input {
  transition: all 0.3s ease;
}

.search-box input:focus {
  box-shadow: 0 0 0 3px rgba(25, 100, 191, 0.2);
  transform: scale(1.02);
}

/* Banner 广告动画 */
.banner-mini-ad {
  transition: all 0.3s ease;
  cursor: pointer;
}

.banner-mini-ad:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* 返回顶部按钮美化 */
.back-top {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.back-top:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

/* 客服按钮动画 */
.cs-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
  animation: float 3s ease-in-out infinite;
}

/* 加载动画 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading::after {
  content: '';
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3f;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .course-card:hover {
    transform: none;
    box-shadow: none;
  }
  
  .btn-vip:hover {
    transform: none;
  }
}

/* 页面滚动渐显效果 */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease;
}

.reveal.active {
  opacity: 1;
  transform: translateY(0);
}

/* 导航栏悬停效果 */
.nav-item a {
  position: relative;
}

.nav-item a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--orange);
  transition: all 0.3s ease;
}

.nav-item a:hover::after {
  left: 0;
  width: 100%;
}

/* 分类筛选条美化 */
.cat-bar li a {
  transition: all 0.3s ease;
  border-radius: 20px;
  padding: 8px 16px;
}

.cat-bar li.active a {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* 热门排行优化 */
.hot-rank {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-item-rank {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(250, 112, 154, 0.3);
}

.side-item-rank.r1 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  animation: pulse 2s ease-in-out infinite;
}

.side-item-rank.r2 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.side-item-rank.r3 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

/* 订阅卡片美化 */
.vip-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
}

.vip-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.5);
}
</style>
`;

// 添加滚动动画检测函数
function initScrollAnimation() {
  const reveals = document.querySelectorAll('.reveal');
  
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 150;
    
    reveals.forEach(reveal => {
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add('active');
      }
    });
  };
  
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // 初始检查
}

// 添加平滑滚动
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  // 注入美化样式
  document.head.insertAdjacentHTML('beforeend', enhancedStyles);
  
  // 初始化动画
  initScrollAnimation();
  initSmoothScroll();
  
  console.log('✅ UI 美化效果已加载');
  console.log('✅ 滚动动画已启用');
  console.log('✅ 平滑滚动已启用');
});
