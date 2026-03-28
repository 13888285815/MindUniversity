<template>
  <div class="customer-service-button">
    <el-badge :is-dot="hasUnread" class="service-badge">
      <el-button
        :type="isOpen ? 'primary' : 'success'"
        :icon="isOpen ? Close : ChatDotRound"
        :size="buttonSize"
        circle
        @click="togglePanel"
        class="service-button"
      >
      </el-button>
    </el-badge>
    
    <!-- 快速消息提示 -->
    <el-dialog
      v-model="showQuickMessage"
      title="🤖 智能客服在线"
      width="400px"
      :close-on-click-modal="true"
    >
      <div class="quick-message-content">
        <p>您好！我是意念科技的智能客服助手</p>
        <p>我可以帮助您解答：</p>
        <ul>
          <li>📊 平台功能和使用方法</li>
          <li>💰 订阅计划和价格咨询</li>
          <li>🔧 技术支持和问题排查</li>
        </ul>
      </div>
      <template #footer>
        <el-button type="primary" @click="openChat">开始对话</el-button>
      </template>
    </el-dialog>

    <!-- 迷你聊天窗口 -->
    <el-dialog
      v-model="showMiniChat"
      title="智能客服"
      width="500px"
      :close-on-click-modal="false"
      @open="handleChatOpen"
      @close="handleChatClose"
      class="mini-chat-dialog"
    >
      <div class="mini-chat-content">
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-if="chatMessages.length === 0" class="welcome-mini">
            <p>您好！我是智能客服 👋</p>
            <p>有什么可以帮您的吗？</p>
            <div class="quick-questions">
              <el-tag
                v-for="question in quickQuestions"
                :key="question"
                size="small"
                class="question-tag"
                @click="sendQuickQuestion(question)"
              >
                {{ question }}
              </el-tag>
            </div>
          </div>
          <div v-else>
            <div v-for="(msg, idx) in chatMessages" :key="idx" class="chat-msg" :class="msg.role">
              <span class="msg-content">{{ msg.content }}</span>
            </div>
          </div>
          <div v-if="isTyping" class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="chat-input-area">
          <el-input
            v-model="miniInputMessage"
            placeholder="输入您的问题..."
            @keyup.enter="sendMiniMessage"
            :disabled="isTyping"
            size="small"
          >
            <template #append>
              <el-button @click="sendMiniMessage" :loading="isTyping" :disabled="!miniInputMessage.trim()">
                发送
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Close } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const props = defineProps({
  buttonSize: {
    type: String,
    default: 'large'
  },
  hasUnread: {
    type: Boolean,
    default: false
  }
})

const isOpen = ref(false)
const showQuickMessage = ref(false)
const showMiniChat = ref(false)
const miniInputMessage = ref('')
const chatMessages = ref([])
const isTyping = ref(false)
const chatMessagesRef = ref(null)

const quickQuestions = ['价格', '订阅', 'API', '预警']

const togglePanel = () => {
  if (!isOpen.value) {
    // 首次点击显示快速提示
    showQuickMessage.value = true
  } else {
    // 打开迷你聊天窗口
    showMiniChat.value = true
  }
  isOpen.value = !isOpen.value
}

const openChat = () => {
  showQuickMessage.value = false
  router.push('/customer-service')
}

const handleChatOpen = () => {
  isOpen.value = true
}

const handleChatClose = () => {
  isOpen.value = false
  showMiniChat.value = false
}

const sendQuickQuestion = (question) => {
  miniInputMessage.value = question
  sendMiniMessage()
}

const sendMiniMessage = async () => {
  const message = miniInputMessage.value.trim()
  if (!message) return

  chatMessages.value.push({
    role: 'user',
    content: message
  })

  miniInputMessage.value = ''
  isTyping.value = true

  try {
    const history = chatMessages.value
      .slice(0, -1)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    const response = await request.post('/api/customer-service/chat', {
      message,
      history
    })

    if (response.success) {
      chatMessages.value.push({
        role: 'assistant',
        content: response.reply
      })
      scrollToBottom()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请稍后再试')
  } finally {
    isTyping.value = false
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  }, 100)
}

// 暴露方法给父组件
defineExpose({
  open: () => togglePanel(),
  close: () => {
    isOpen.value = false
    showMiniChat.value = false
  }
})
</script>

<style scoped>
.customer-service-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.service-button {
  width: 60px;
  height: 60px;
  font-size: 28px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
  transition: all 0.3s;
  animation: pulse 2s infinite;
}

.service-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(102, 126, 234, 0.7);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.quick-message-content {
  line-height: 1.8;
  color: #666;
}

.quick-message-content p {
  margin: 12px 0;
}

.quick-message-content ul {
  margin: 12px 0;
  padding-left: 24px;
}

.quick-message-content li {
  margin: 8px 0;
}

/* 迷你聊天窗口样式 */
.mini-chat-content {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.welcome-mini {
  text-align: center;
  color: #666;
  padding: 20px;
}

.welcome-mini p {
  margin: 12px 0;
}

.quick-questions {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.question-tag {
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
}

.question-tag:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.chat-msg {
  margin-bottom: 12px;
  display: flex;
}

.chat-msg.user {
  justify-content: flex-end;
}

.chat-msg.assistant {
  justify-content: flex-start;
}

.msg-content {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  line-height: 1.5;
}

.chat-msg.user .msg-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 4px 12px;
}

.chat-msg.assistant .msg-content {
  background: white;
  color: #333;
  border: 1px solid #e8e8e8;
  border-radius: 12px 12px 12px 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  width: fit-content;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
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
    transform: translateY(-6px);
  }
}

.chat-input-area {
  margin-top: auto;
}

/* 响应式 */
@media (max-width: 768px) {
  .customer-service-button {
    bottom: 20px;
    right: 20px;
  }

  .service-button {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
}

/* 全局样式覆盖 */
:deep(.mini-chat-dialog .el-dialog__body) {
  padding: 16px;
}
</style>
