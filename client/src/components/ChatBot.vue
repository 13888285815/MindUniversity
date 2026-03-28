<template>
  <!-- Floating Chat Button -->
  <div class="chatbot-container">
    <transition name="bounce">
      <div v-if="!open" class="chat-fab" @click="open = true" title="智能客服">
        <span class="fab-icon">🤖</span>
        <span class="fab-pulse"></span>
      </div>
    </transition>

    <!-- Chat Window -->
    <transition name="slide-up">
      <div v-if="open" class="chat-window">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-info">
            <span class="bot-avatar">🤖</span>
            <div>
              <div class="bot-name">智慧客服</div>
              <div class="bot-status">
                <span class="status-dot"></span> 在线
              </div>
            </div>
          </div>
          <el-button text @click="open = false" style="color:#718096;">
            <el-icon :size="18"><Close /></el-icon>
          </el-button>
        </div>

        <!-- Messages -->
        <div ref="messagesRef" class="chat-messages" @scroll="onScroll">
          <!-- Welcome Message -->
          <div v-if="messages.length === 0" class="welcome-section">
            <div class="welcome-icon">🤖</div>
            <h3>智慧证券 AI 客服</h3>
            <p>我可以帮你解答证券分析、平台功能、账户等问题</p>
            <div class="quick-topics">
              <div v-for="topic in quickTopics" :key="topic.text" class="topic-chip" @click="sendQuickMessage(topic.text)">
                {{ topic.icon }} {{ topic.text }}
              </div>
            </div>
          </div>

          <!-- Message List -->
          <div v-for="(msg, idx) in messages" :key="idx" :class="['message-row', msg.role]">
            <div v-if="msg.role === 'bot'" class="bot-avatar-sm">🤖</div>
            <div :class="['message-bubble', msg.role]">
              <div v-if="msg.role === 'bot' && msg.quickReplies" class="quick-replies">
                <span v-for="qr in msg.quickReplies" :key="qr" class="reply-chip" @click="sendQuickMessage(qr)">{{ qr }}</span>
              </div>
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="typing" class="message-row bot">
            <div class="bot-avatar-sm">🤖</div>
            <div class="message-bubble bot typing-bubble">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions Bar -->
        <div v-if="messages.length > 0" class="quick-actions">
          <div v-for="action in contextActions" :key="action.text" class="action-chip" @click="sendQuickMessage(action.text)">
            {{ action.icon }} {{ action.text }}
          </div>
        </div>

        <!-- Input Area -->
        <div class="chat-input">
          <el-input
            v-model="inputText"
            placeholder="输入你的问题..."
            @keyup.enter="sendMessage"
            :disabled="typing"
            size="default"
          >
            <template #append>
              <el-button @click="sendMessage" :disabled="!inputText.trim() || typing" type="primary">
                <el-icon><Promotion /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Close, Promotion } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'
import { API_BASE } from '../utils/config'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()

const open = ref(false)
const messages = ref([])
const inputText = ref('')
const typing = ref(false)
const messagesRef = ref(null)

const quickTopics = [
  { icon: '📈', text: '如何查看行情' },
  { icon: '🤖', text: 'AI分析怎么用' },
  { icon: '💎', text: '订阅计划介绍' },
  { icon: '🔑', text: 'API Key怎么获取' },
  { icon: '⭐', text: '自选股功能' },
  { icon: '🔔', text: '价格预警设置' },
]

const contextActions = [
  { icon: '📊', text: '查看行情中心' },
  { icon: '🤖', text: 'AI分析股票' },
  { icon: '💰', text: 'Token充值' },
]

// Knowledge base for smart responses
const knowledgeBase = [
  {
    keywords: ['行情', '看盘', '股票行情', '大盘', '指数', '涨停', '跌停', '涨跌'],
    answer: `📊 **行情查看指南**

**公开行情**：访问 <a href="/market" style="color:#e94560">行情中心</a>，无需登录即可查看：
- 涨幅榜 / 跌幅榜 / 成交额榜
- 搜索股票代码查看实时行情

**登录后更多功能**：
- 仪表盘查看大盘指数、板块行情
- 个股分析页查看 K 线图、五档盘口
- 支持A股、港股、美股多市场`,
    quickReplies: ['查看涨幅榜', '如何搜索股票', 'K线图怎么用']
  },
  {
    keywords: ['AI', '分析', '智能分析', '股票分析', '技术分析'],
    answer: `🤖 **AI 智能分析使用指南**

1. 登录后进入 <a href="/ai" style="color:#e94560">AI分析页面</a>
2. 输入股票代码（如 600519）
3. 选择市场（上海/深圳/港股/美股）
4. 选择分析类型：
   - **综合分析**：技术面+基本面+风险评估
   - **技术分析**：K线形态、均线、MACD等
   - **基本面分析**：财报、估值、行业地位
   - **风险评估**：波动率、最大回撤、风险等级

⏰ **每日分析次数**：
- 免费版：3次/天
- 入门版：20次/天
- 专业版/企业版：无限次`,
    quickReplies: ['免费版有什么限制', '如何升级到Pro', '分析结果怎么看']
  },
  {
    keywords: ['订阅', '升级', '套餐', '会员', '计划', '收费', '价格', '多少钱'],
    answer: `💎 **订阅计划**

| 计划 | 价格 | AI分析/天 | 自选股 | 预警 |
|------|------|----------|--------|------|
| Free | 免费 | 3次 | 20只 | 5个 |
| Starter | ¥49/月 | 20次 | 50只 | 20个 |
| Pro | ¥199/月 | 无限 | 200只 | 无限 |
| Enterprise | ¥999/月 | 无限 | 无限 | 无限 |

前往 <a href="/subscription" style="color:#e94560">订阅管理</a> 查看详情和升级`,
    quickReplies: ['Pro和Enterprise区别', '如何取消订阅', '可以用API吗']
  },
  {
    keywords: ['API', '接口', 'key', '密钥', 'token', '开发'],
    answer: `🔑 **API Key 使用指南**

1. 登录后进入 <a href="/api-keys" style="color:#e94560">API Keys 页面</a>
2. 点击"创建 API Key"
3. 设置名称和权限
4. 复制生成的 Key（仅显示一次）

**API 调用方式**：
\`\`\`
POST /api/ai/v1/chat/completions
Authorization: Bearer your-api-key
\`\`\`

**注意**：API 调用会消耗 Token 余额，Pro 及以上计划才开放 API 访问权限。

查看 <a href="/billing" style="color:#e94560">Token 用量</a> 了解计费详情`,
    quickReplies: ['Token怎么充值', 'API调用限制']
  },
  {
    keywords: ['自选', '关注', '收藏', 'watchlist'],
    answer: `⭐ **自选股管理**

**添加方式**：
- 在个股分析页点击"自选"按钮
- 在自选股页面搜索代码直接添加

**管理功能**：
- 查看 <a href="/watchlist" style="color:#e94560">自选股列表</a>
- 实时查看自选股行情
- 一键跳转到个股分析
- 支持A股、港股、美股

**自选股上限**：
- 免费版：20只
- 入门版：50只
- 专业版：200只`,
    quickReplies: ['如何删除自选', '自选股能分组吗']
  },
  {
    keywords: ['预警', '提醒', '通知', '价格预警'],
    answer: `🔔 **价格预警设置**

**支持条件**：
- 价格高于 / 低于指定值
- 涨幅超过 / 跌幅超过指定值
- 成交量突破

**设置方式**：
- 个股分析页点击"预警"按钮
- <a href="/alerts" style="color:#e94560">预警管理页面</a> 新建

**管理**：
- 暂停/恢复预警
- 查看触发历史
- 删除不需要的预警`,
    quickReplies: ['预警数量有限制吗', '怎么收到通知']
  },
  {
    keywords: ['注册', '登录', '账号', '密码', '忘记密码'],
    answer: `👤 **账号相关**

**注册**：访问 <a href="/register" style="color:#e94560">注册页面</a>，填写用户名、邮箱和密码
- 密码要求：至少8位，含大小写字母和数字
- 注册后需要验证邮箱

**登录**：访问 <a href="/login" style="color:#e94560">登录页面</a>，使用邮箱和密码

**忘记密码**：请在登录页面点击"忘记密码"链接

**安全提示**：建议使用强密码并定期更换`,
    quickReplies: ['邮箱没收到验证', '如何修改密码']
  },
  {
    keywords: ['充值', '付款', '支付', '发票'],
    answer: `💰 **充值与计费**

系统使用 Token 计费模式：
- 每次AI分析消耗一定数量的 Token
- API 调用按输入/输出 Token 分别计费
- 不同模型消耗不同数量的 Token

**查看用量**：
- <a href="/billing" style="color:#e94560">Token & 计费页面</a> 查看余额和使用记录

**充值方式**：
- 目前通过订阅计划获取 Token 额度
- 升级计划自动获得更多额度`,
    quickReplies: ['如何查看消费记录', 'Pro版有什么权益']
  },
  {
    keywords: ['你好', 'hi', 'hello', '嗨', '在吗', '你是谁'],
    answer: `👋 你好！我是**智慧证券 AI 客服**，很高兴为你服务！

我可以帮你解答以下问题：
- 📈 行情查看
- 🤖 AI分析功能
- 💎 订阅与计费
- 🔑 API 使用
- ⭐ 自选股管理
- 🔔 预警设置
- 👤 账号相关

请直接输入你的问题，或点击下方快捷按钮！`,
    quickReplies: ['平台功能介绍', '如何开始使用', '订阅计划']
  },
  {
    keywords: ['功能', '介绍', '平台', '产品', '特点'],
    answer: `📊 **智慧证券平台功能介绍**

**核心功能**：
- 📈 **专业行情**：实时K线、分时图、五档盘口，涵盖A股/港股/美股
- 🤖 **AI智能分析**：大模型驱动的技术分析、基本面评估和操作建议
- ⭐ **自选股管理**：灵活分组、标签管理
- 🔔 **智能预警**：多维度实时价格推送
- 🔑 **API接口**：OpenAI兼容API，精确Token计费
- 💎 **分层订阅**：Free/Starter/Pro/Enterprise

**特色**：
- 类银河证券智慧星的专业行情体验
- 同花顺级别的数据分析能力
- AI驱动的智能选股和风险评估`,
    quickReplies: ['AI分析怎么用', '订阅计划介绍', '如何开始']
  },
  {
    keywords: ['手机', '移动端', 'app', '下载', '小程序', '微信'],
    answer: `📱 **关于移动端**

目前智慧证券是 **Web 应用**，支持电脑和手机浏览器访问：
- 📱 手机浏览器打开 **yndxw.com** 即可使用
- 页面已适配移动端显示
- 推荐使用 Chrome / Safari 浏览器

未来计划：
- 微信小程序版本开发中
- iOS/Android 原生 App 规划中`,
    quickReplies: ['电脑端推荐浏览器', '有iPad版吗']
  }
]

// Default fallback response
const defaultResponse = {
  answer: `抱歉，我暂时无法回答这个问题。你可以：

1. 尝试用不同的关键词描述你的问题
2. 查看我们的 <a href="/subscription" style="color:#e94560">帮助文档</a>
3. 联系客服邮箱：support@yndxw.com

我会持续学习，争取下次能帮到你！ 😊`,
  quickReplies: ['平台功能介绍', '订阅计划', '联系客服']
}

const findAnswer = (text) => {
  const lower = text.toLowerCase()
  for (const item of knowledgeBase) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return item
    }
  }
  return defaultResponse
}

const formatMessage = (content) => {
  // Convert markdown-like formatting to HTML
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>')
    .replace(/\n/g, '<br>')
}

const sendQuickMessage = (text) => {
  inputText.value = text
  sendMessage()
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || typing.value) return

  // Add user message
  messages.value.push({
    role: 'user',
    content: text,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
  inputText.value = ''

  await nextTick()
  scrollToBottom()

  // Show typing
  typing.value = true

  // Simulate response delay
  await new Promise(r => setTimeout(r, 600 + Math.random() * 800))

  // Find answer
  const answer = findAnswer(text)

  // Add bot response
  messages.value.push({
    role: 'bot',
    content: answer.answer,
    quickReplies: answer.quickReplies,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
  typing.value = false

  await nextTick()
  scrollToBottom()
}

const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const onScroll = () => {
  // Could implement load more history
}
</script>

<style scoped>
/* Floating Button */
.chatbot-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

.chat-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(233,69,96,0.4);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}
.chat-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(233,69,96,0.5);
}
.fab-icon { font-size: 26px; }
.fab-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(233,69,96,0.4);
  animation: pulse-ring 2s ease-out infinite;
}
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}

/* Chat Window */
.chat-window {
  width: 380px;
  height: 560px;
  background: #0f0f23;
  border: 1px solid #2d2d44;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
  overflow: hidden;
  position: fixed;
  bottom: 24px;
  right: 24px;
}

/* Header */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #1a1a2e;
  border-bottom: 1px solid #2d2d44;
}
.header-info { display: flex; align-items: center; gap: 10px; }
.bot-avatar { font-size: 28px; }
.bot-name { color: #f7fafc; font-weight: 600; font-size: 15px; }
.bot-status { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #4a5568; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: #2ed573; display: inline-block; }

/* Messages Area */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: #2d2d44; border-radius: 4px; }

/* Welcome */
.welcome-section { text-align: center; padding: 24px 16px; }
.welcome-icon { font-size: 48px; margin-bottom: 12px; }
.welcome-section h3 { color: #f7fafc; font-size: 18px; margin-bottom: 8px; }
.welcome-section p { color: #718096; font-size: 13px; margin-bottom: 20px; }
.quick-topics { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.topic-chip {
  padding: 6px 14px;
  background: #16213e;
  border: 1px solid #2d2d44;
  border-radius: 16px;
  font-size: 13px;
  color: #a0aec0;
  cursor: pointer;
  transition: all 0.2s;
}
.topic-chip:hover { border-color: #e94560; color: #e94560; background: rgba(233,69,96,0.08); }

/* Messages */
.message-row { display: flex; gap: 8px; align-items: flex-start; }
.message-row.user { justify-content: flex-end; }
.message-row.bot { justify-content: flex-start; }

.bot-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  border: 1px solid #2d2d44;
}

.message-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
}
.message-bubble.bot {
  background: #1a1a2e;
  border: 1px solid #2d2d44;
  color: #e2e8f0;
  border-top-left-radius: 4px;
}
.message-bubble.user {
  background: linear-gradient(135deg, #e94560, #d63851);
  color: white;
  border-top-right-radius: 4px;
}
.message-text { word-break: break-word; }
.message-text :deep(strong) { color: #f7fafc; }
.message-text :deep(a) { color: #e94560; text-decoration: none; }
.message-text :deep(a:hover) { text-decoration: underline; }
.message-text :deep(.code-block) {
  background: #0f0f23;
  border: 1px solid #2d2d44;
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  margin: 8px 0;
  white-space: pre-wrap;
  color: #a0aec0;
}
.message-time { font-size: 10px; color: #4a5568; margin-top: 4px; }

/* Quick Replies in messages */
.quick-replies { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.reply-chip {
  padding: 4px 10px;
  background: rgba(233,69,96,0.12);
  border: 1px solid rgba(233,69,96,0.25);
  border-radius: 12px;
  font-size: 12px;
  color: #e94560;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.reply-chip:hover { background: rgba(233,69,96,0.2); border-color: #e94560; }

/* Typing */
.typing-bubble { padding: 14px 18px; }
.typing-dots { display: flex; gap: 4px; }
.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4a5568;
  animation: typing-bounce 1.4s ease-in-out infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* Quick Actions Bar */
.quick-actions {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  border-top: 1px solid #2d2d44;
  overflow-x: auto;
}
.action-chip {
  padding: 5px 12px;
  background: #16213e;
  border: 1px solid #2d2d44;
  border-radius: 14px;
  font-size: 12px;
  color: #a0aec0;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}
.action-chip:hover { border-color: #e94560; color: #e94560; }

/* Input */
.chat-input {
  padding: 12px 16px;
  border-top: 1px solid #2d2d44;
  background: #1a1a2e;
}
.chat-input :deep(.el-input__wrapper) {
  background: #16213e;
  border-color: #2d2d44;
  box-shadow: none;
  border-radius: 20px;
}
.chat-input :deep(.el-input__inner) {
  color: #e2e8f0;
}
.chat-input :deep(.el-input__inner::placeholder) {
  color: #4a5568;
}
.chat-input :deep(.el-input-group__append) {
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  border: none;
  border-radius: 0 20px 20px 0;
  box-shadow: none;
}
.chat-input :deep(.el-input-group__append .el-button) {
  color: white;
}

/* Transitions */
.bounce-enter-active { animation: bounce-in 0.4s; }
.bounce-leave-active { animation: bounce-in 0.3s reverse; }
@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.slide-up-enter-active { animation: slide-up 0.3s ease-out; }
.slide-up-leave-active { animation: slide-up 0.2s ease-in reverse; }
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 16px);
    height: calc(100vh - 100px);
    bottom: 8px;
    right: 8px;
    border-radius: 12px;
  }
  .chatbot-container { bottom: 16px; right: 16px; }
}
</style>
