<template>
  <div class="customer-service-page">
    <el-container>
      <el-aside width="280px" class="faq-sidebar">
        <div class="sidebar-header">
          <el-icon><QuestionFilled /></el-icon>
          <h3>常见问题</h3>
        </div>
        
        <el-menu
          :default-active="activeCategory"
          @select="handleCategorySelect"
          class="faq-menu"
        >
          <el-menu-item 
            v-for="category in categories" 
            :key="category"
            :index="category"
          >
            <span>{{ category }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main-content">
        <!-- 聊天区域 -->
        <div class="chat-container">
          <div class="chat-header">
            <div class="header-left">
              <el-avatar :size="40" class="bot-avatar">
                <el-icon><ChatDotRound /></el-icon>
              </el-avatar>
              <div class="bot-info">
                <h3>意念科技智能客服</h3>
                <span class="status-text">
                  <el-icon class="status-icon"><CircleCheck /></el-icon>
                  在线
                </span>
              </div>
            </div>
            <div class="header-actions">
              <el-button
                type="primary"
                size="small"
                @click="clearHistory"
                :disabled="messages.length === 0"
              >
                <el-icon><Delete /></el-icon>
                清空对话
              </el-button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div class="messages-container" ref="messagesContainer">
            <!-- 欢迎消息 -->
            <div v-if="messages.length === 0" class="welcome-message">
              <div class="bot-message">
                <div class="message-content">
                  <p>您好！我是意念科技的智能客服助手 👋</p>
                  <p>我可以帮助您解答：</p>
                  <ul class="help-list">
                    <li>📊 平台功能和使用方法</li>
                    <li>💰 订阅计划和价格咨询</li>
                    <li>🔧 技术支持和问题排查</li>
                    <li>📋 账单查询和API使用</li>
                  </ul>
                  <p>您可以开始提问，或者从右侧常见问题中选择。</p>
                </div>
              </div>
            </div>

            <!-- 聊天消息 -->
            <div v-for="(message, index) in messages" :key="index" class="message-row">
              <div v-if="message.role === 'user'" class="user-message">
                <div class="message-content">
                  {{ message.content }}
                </div>
              </div>
              <div v-else class="bot-message">
                <el-avatar :size="32" class="bot-avatar-small">
                  <el-icon><ChatDotRound /></el-icon>
                </el-avatar>
                <div class="message-content">
                  <div v-html="formatMessage(message.content)"></div>
                  <div v-if="message.isQuickReply" class="quick-reply-tag">
                    <el-tag type="success" size="small">快速回复</el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- 加载中 -->
            <div v-if="loading" class="message-row">
              <div class="bot-message">
                <el-avatar :size="32" class="bot-avatar-small">
                  <el-icon><ChatDotRound /></el-icon>
                </el-avatar>
                <div class="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="input-container">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="请输入您的问题..."
              @keydown.enter.prevent="handleEnter"
              :disabled="loading"
              resize="none"
              class="chat-input"
            />
            <div class="input-actions">
              <div class="quick-actions">
                <el-tag
                  v-for="quickAction in quickActions"
                  :key="quickAction"
                  size="small"
                  class="quick-action-tag"
                  @click="handleQuickAction(quickAction)"
                >
                  {{ quickAction }}
                </el-tag>
              </div>
              <el-button
                type="primary"
                @click="sendMessage"
                :disabled="!inputMessage.trim() || loading"
                :loading="loading"
              >
                发送
                <el-icon class="el-icon--right"><Position /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- FAQ 面板 -->
        <div v-if="activeCategory" class="faq-panel">
          <div class="faq-header">
            <h3>{{ activeCategory }}</h3>
            <el-button
              type="text"
              @click="activeCategory = null"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="faq-list">
            <el-collapse v-model="activeFAQ" accordion>
              <el-collapse-item
                v-for="(item, index) in currentFAQ"
                :key="index"
                :name="index"
              >
                <template #title>
                  <span class="faq-question">{{ item.question }}</span>
                </template>
                <div class="faq-answer" v-html="formatMessage(item.answer)"></div>
                <el-button
                  type="primary"
                  size="small"
                  plain
                  @click="sendMessage(item.question)"
                  class="faq-action"
                >
                  <el-icon><ChatDotRound /></el-icon>
                  深入了解
                </el-button>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, QuestionFilled, CircleCheck, Delete, Close, Position } from '@element-plus/icons-vue'
import request from '../utils/request'

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const messagesContainer = ref(null)
const categories = ref([])
const activeCategory = ref(null)
const faqData = ref({})
const activeFAQ = ref([])

const quickActions = ['价格', '订阅', '免费', 'API', '预警', '联系']

const currentFAQ = computed(() => {
  if (!activeCategory.value || !faqData.value[activeCategory.value]) {
    return []
  }
  return faqData.value[activeCategory.value]
})

// 获取 FAQ 分类
const fetchCategories = async () => {
  try {
    const response = await request.get('/api/customer-service/categories')
    if (response.success) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 获取 FAQ 数据
const fetchFAQ = async () => {
  try {
    const response = await request.get('/api/customer-service/faq')
    if (response.success) {
      faqData.value = {}
      response.data.forEach(item => {
        faqData.value[item.category] = item.questions
      })
    }
  } catch (error) {
    console.error('获取 FAQ 失败:', error)
  }
}

// 处理分类选择
const handleCategorySelect = (category) => {
  activeCategory.value = category === activeCategory.value ? null : category
}

// 发送消息
const sendMessage = async (message = null) => {
  const content = message || inputMessage.value.trim()
  if (!content) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content
  })

  inputMessage.value = ''
  loading.value = true

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    const history = messages.value
      .slice(0, -1)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    const response = await request.post('/api/customer-service/chat', {
      message: content,
      history
    })

    if (response.success) {
      messages.value.push({
        role: 'assistant',
        content: response.reply,
        isQuickReply: response.isQuickReply
      })
    } else {
      ElMessage.error(response.message || '获取回复失败')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请稍后再试')
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 处理回车键
const handleEnter = (event) => {
  if (!event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 快捷操作
const handleQuickAction = (action) => {
  inputMessage.value = action
  sendMessage()
}

// 清空对话
const clearHistory = () => {
  messages.value = []
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化消息（简单的换行和链接处理）
const formatMessage = (text) => {
  if (!text) return ''
  return text
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="message-link">$1</a>')
}

onMounted(() => {
  fetchCategories()
  fetchFAQ()
})
</script>

<style scoped>
.customer-service-page {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.el-container {
  height: 100%;
}

/* 侧边栏样式 */
.faq-sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 24px;
  text-align: center;
  border-bottom: 1px solid #e8e8e8;
}

.sidebar-header .el-icon {
  font-size: 32px;
  color: #667eea;
  margin-bottom: 8px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.faq-menu {
  border: none;
  height: calc(100vh - 80px);
  overflow-y: auto;
}

.faq-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  padding: 0 20px !important;
}

/* 主内容区域 */
.main-content {
  padding: 0;
  position: relative;
}

/* 聊天容器 */
.chat-container {
  height: calc(100vh - 0px);
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
}

.chat-header {
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bot-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bot-info h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.status-text {
  font-size: 14px;
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-icon {
  font-size: 14px;
}

/* 消息区域 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scroll-behavior: smooth;
}

.message-row {
  margin-bottom: 20px;
}

.user-message {
  display: flex;
  justify-content: flex-end;
}

.user-message .message-content {
  max-width: 70%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.bot-message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.bot-message .message-content {
  max-width: 70%;
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.bot-avatar-small {
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-top: 4px;
}

.quick-reply-tag {
  margin-top: 8px;
}

.message-content p {
  margin: 8px 0;
  line-height: 1.6;
}

.message-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.message-content li {
  margin: 4px 0;
  line-height: 1.6;
}

.message-link {
  color: #667eea;
  text-decoration: none;
}

.message-link:hover {
  text-decoration: underline;
}

/* 欢迎消息 */
.welcome-message {
  padding: 20px 0;
}

.help-list {
  background: rgba(102, 126, 234, 0.1);
  padding: 16px 20px;
  border-radius: 8px;
  margin: 12px 0;
}

.help-list li {
  margin: 8px 0;
  color: #667eea;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}

/* 输入区域 */
.input-container {
  background: white;
  padding: 16px 24px;
  border-top: 1px solid #e8e8e8;
}

.chat-input {
  margin-bottom: 12px;
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  padding: 12px 16px;
  resize: none;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-action-tag {
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
}

.quick-action-tag:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

/* FAQ 面板 */
.faq-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  height: 100%;
  background: white;
  box-shadow: -2px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.faq-header {
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.faq-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.faq-question {
  font-weight: 600;
  color: #333;
}

.faq-answer {
  padding: 12px 0;
  line-height: 1.6;
  color: #666;
}

.faq-action {
  margin-top: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .faq-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .faq-sidebar.mobile-open {
    transform: translateX(0);
  }

  .faq-panel {
    width: 100%;
  }

  .user-message .message-content,
  .bot-message .message-content {
    max-width: 85%;
  }
}
</style>
