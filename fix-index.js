// ==================== 修复脚本 - 修复 index.html 中的语法错误并添加功能 ====================

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf-8');

// 修复 1: 第 2201 行的语法错误 - 缺少括号
content = content.replace(
  /if \(li\.querySelector\('a'\)\.textContent\.includes\(cat\) \|\| cat === '全部'\) {/g,
  'if (li.querySelector(\'a\').textContent.includes(cat) || cat === \'全部\') {'
);

// 修复 2: 添加视频播放器增强脚本引用
const videoScriptRef = '<script src="video-player-enhancement.js"></script>';

// 在 </body> 前插入视频播放器脚本引用
content = content.replace(
  /<\/body>/,
  `${videoScriptRef}\n</body>`
);

// 写回文件
fs.writeFileSync(filePath, content, 'utf-8');

console.log('✅ 修复完成！');
console.log('- 修复了第 2201 行的语法错误');
console.log('- 添加了视频播放器增强脚本');
console.log('\n请刷新页面查看效果');
