// ==================== 视频播放功能增强 ====================

// 创建视频播放器容器
function createVideoPlayer() {
  // 检查是否已存在
  if (document.getElementById('videoPlayerModal')) return;
  
  const videoModal = document.createElement('div');
  videoModal.id = 'videoPlayerModal';
  videoModal.className = 'modal-overlay video-modal';
  videoModal.innerHTML = `
    <div class="video-player-container">
      <div class="video-header">
        <h3 id="videoTitle">视频播放</h3>
        <button class="video-close" onclick="closeVideoPlayer()">×</button>
      </div>
      <div class="video-wrapper">
        <video id="mainVideo" controls>
          <source src="" type="video/mp4">
          您的浏览器不支持视频播放
        </video>
      </div>
      <div class="video-info">
        <div class="video-course-title" id="videoCourseTitle"></div>
        <div class="video-controls">
          <button class="video-btn" onclick="prevLesson()">⬆️ 上一节</button>
          <button class="video-btn" onclick="nextLesson()">⬇️ 下一节</button>
          <button class="video-btn primary" onclick="closeVideoPlayer()">关闭</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(videoModal);
}

// 打开视频播放器
function openVideoPlayer(courseTitle, lessonTitle) {
  createVideoPlayer();
  
  document.getElementById('videoCourseTitle').textContent = `${courseTitle} - ${lessonTitle}`;
  document.getElementById('videoTitle').textContent = lessonTitle;
  
  // 使用演示视频（实际项目中替换为真实视频URL）
  const demoVideos = [
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    'https://www.w3schools.com/html/movie.mp4'
  ];
  
  const videoUrl = demoVideos[Math.floor(Math.random() * demoVideos.length)];
  document.getElementById('mainVideo').src = videoUrl;
  
  document.getElementById('videoPlayerModal').style.display = 'flex';
  document.getElementById('mainVideo').play().catch(e => {
    console.log('自动播放失败，需要用户交互');
  });
}

// 关闭视频播放器
function closeVideoPlayer() {
  const modal = document.getElementById('videoPlayerModal');
  if (modal) {
    const video = document.getElementById('mainVideo');
    video.pause();
    video.src = '';
    modal.style.display = 'none';
  }
}

// 播放课程
function playLessonWithVideo(courseId, lessonIndex) {
  const c = courses.find(x => x.id === courseId);
  if (!c) return;
  
  const lessonTitle = `第${lessonIndex + 1}节：${c.title.slice(0, 10)}...`;
  
  // 检查是否是免费课程
  if (lessonIndex >= 2) {
    showToast('请先登录并开通VIP会员后观看！');
    setTimeout(() => {
      hideModal('courseModal');
      showModal('loginModal');
    }, 1500);
    return;
  }
  
  // 关闭课程详情，打开视频播放器
  hideModal('courseModal');
  
  // 延迟一下让模态框动画完成
  setTimeout(() => {
    openVideoPlayer(c.title, lessonTitle);
    showToast('开始播放免费试看课程...');
  }, 300);
}

// 上一节课程
function prevLesson() {
  showToast('已是第一节课程');
}

// 下一节课程
function nextLesson() {
  showToast('请开通VIP会员查看更多课程');
}

// 增强课程详情函数
function showCourseDetailEnhanced(id) {
  const c = courses.find(x => x.id === id);
  if (!c) return;
  
  document.getElementById('courseModalTitle').textContent = c.title;
  
  // 生成章节和课时
  const chapterHtml = Array.from({length: Math.min(c.chapters, 5)}, (_, ci) => {
    const lessonsPerChap = Math.ceil(c.lessons / c.chapters);
    const lessonItems = Array.from({length: Math.min(lessonsPerChap, 6)}, (_, li) => {
      const isFree = li < 2;
      return `
        <div class="lesson-item" onclick="playLessonWithVideo(${c.id}, ${li})">
          <span class="lesson-icon">▶</span>
          第${li+1}节：${c.title.split('').slice(0, 8+li).join('')}...
          ${isFree ? '<span class="lesson-free">免费试看</span>' : '<span class="lesson-lock">🔒 VIP</span>'}
        </div>
      `;
    }).join('');
    return `
      <div class="chapter-item">
        <div class="chapter-title">
          第${ci+1}章：${['基础入门', '核心功能', '实战案例', '进阶技巧', '综合项目'][ci]}
          <span style="color:#999;font-size:12px">共${lessonsPerChap}节</span>
        </div>
        <div class="lesson-list">${lessonItems}</div>
      </div>
    `;
  }).join('');
  
  document.getElementById('courseModalContent').innerHTML = `
    <div class="course-detail-header">
      <div class="course-detail-thumb ${c.bg}">${c.icon}</div>
      <div class="course-detail-info">
        <h2>${c.title}</h2>
        <div class="course-detail-meta">
          <span class="meta-tag">📂 ${c.cat}</span>
          <span class="meta-tag">🎓 ${c.level}</span>
          <span class="meta-tag">👁 ${c.views}次观看</span>
          <span class="meta-tag">📹 ${c.lessons}集</span>
          <span class="meta-tag">👨‍🏫 ${c.teacher}</span>
        </div>
        <div class="course-detail-rating">
          <span class="stars">★★★★★</span>
          <span class="rating-num">4.9</span>
          <span class="rating-count">（${Math.floor(Math.random()*5000+1000)}人评价）</span>
        </div>
        <div class="detail-btns">
          <button class="btn-study" onclick="playLessonWithVideo(${c.id}, 0)">▶ 立即学习</button>
          <button class="btn-collect" onclick="addToFavorites(${c.id})">⭐ 收藏课程</button>
          <button class="btn-collect" onclick="shareCourse(${c.id})">🔗 分享</button>
        </div>
      </div>
    </div>
    <div class="course-detail-body">
      <div class="section-header" style="margin-bottom:12px">
        <div class="section-title" style="font-size:15px">课程目录</div>
        <span style="font-size:13px;color:#999">共 ${c.chapters} 章 · ${c.lessons} 集</span>
      </div>
      <div class="chapter-list">${chapterHtml}</div>
    </div>
  `;
  
  showModal('courseModal');
}

// 添加收藏功能
function addToFavorites(courseId) {
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  if (!favorites.includes(courseId)) {
    favorites.push(courseId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    showToast('✅ 课程已添加到收藏');
  } else {
    showToast('❌ 课程已在收藏中');
  }
}

// 分享功能
function shareCourse(courseId) {
  const c = courses.find(x => x.id === courseId);
  const shareText = `我发现了一个超棒的视频课程：《${c.title}》\n\n课程分类：${c.cat}\n授课老师：${c.teacher}\n\n快来学习吧！`;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('📋 分享文案已复制到剪贴板');
    }).catch(() => {
      showToast('复制失败，请手动复制');
    });
  } else {
    showToast('浏览器不支持自动复制，请手动分享');
  }
}

// 页面加载后替换原函数
window.addEventListener('DOMContentLoaded', () => {
  // 替换课程详情函数
  window.showCourseDetail = showCourseDetailEnhanced;
  
  console.log('✅ 视频播放功能已加载');
});

// CSS 样式（添加到页面）
const videoPlayerStyles = `
<style>
.video-modal {
  background: rgba(0,0,0,0.9);
  z-index: 2000;
}

.video-player-container {
  background: #1a1a1a;
  border-radius: 12px;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
}

.video-header h3 {
  color: #fff;
  margin: 0;
  font-size: 18px;
}

.video-close {
  background: #ff4444;
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
}

.video-wrapper {
  position: relative;
  width: 100%;
  background: #000;
  padding: 20px;
}

#mainVideo {
  width: 100%;
  border-radius: 8px;
  max-height: 500px;
}

.video-info {
  padding: 20px;
  border-top: 1px solid #333;
}

.video-course-title {
  color: #fff;
  font-size: 16px;
  margin-bottom: 15px;
  line-height: 1.5;
}

.video-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.video-btn {
  background: #333;
  color: #fff;
  border: 1px solid #444;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.video-btn:hover {
  background: #444;
}

.video-btn.primary {
  background: #1964bf;
  border-color: #1964bf;
}

.video-btn.primary:hover {
  background: #1450a0;
}

@media (max-width: 768px) {
  .video-controls {
    flex-direction: column;
  }
  
  .video-btn {
    width: 100%;
  }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', videoPlayerStyles);
