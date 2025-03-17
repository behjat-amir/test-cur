<template>
  <div class="chat-box">
    <div class="chat-header">
      <h3 class="chat-title">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 ml-2 text-secondary-400">
          <path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-7.152.52c-2.43 0-4.817-.178-7.152-.52C3.37 16.438 2 14.706 2 12.76V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9z" clip-rule="evenodd" />
        </svg>
        چت و حدس کلمه
      </h3>
      <div class="chat-status" :class="{ 'status-active': !isDrawer, 'status-inactive': isDrawer }">
        {{ isDrawer ? 'در حال نقاشی...' : 'حدس کلمه' }}
      </div>
    </div>
    <div class="messages" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.type]"
      >
        <div class="message-header">
          <span class="username">{{ message.username === 'You' ? 'شما' : message.username === 'System' ? 'سیستم' : message.username }}</span>
          <span class="message-time">{{ message.time }}</span>
        </div>
        <div class="message-content">{{ message.text }}</div>
      </div>
      <div v-if="messages.length === 0" class="empty-messages">
        <div class="text-center text-gray-400 italic">
          هنوز پیامی ارسال نشده است...
        </div>
      </div>
    </div>
    <form @submit.prevent="sendMessage" class="message-form">
      <input
        v-model="newMessage"
        type="text"
        placeholder="حدس خود را اینجا بنویسید..."
        :disabled="isDrawer"
        class="message-input"
      />
      <button type="submit" :disabled="isDrawer" class="send-button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isDrawer: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['guess'])

const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)

// Format time to HH:MM
const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const addMessage = (message) => {
  // Add time to message
  if (!message.time) {
    message.time = formatTime();
  }
  
  messages.value.push(message)
  // Scroll to bottom on new message
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }, 50)
}

const sendMessage = () => {
  if (newMessage.value.trim() && !props.isDrawer) {
    emit('guess', newMessage.value)
    addMessage({
      username: 'You',
      text: newMessage.value,
      type: 'guess'
    })
    newMessage.value = ''
  }
}

// Method to receive messages from other players
const receiveMessage = (message) => {
  addMessage({
    username: message.username,
    text: message.guess,
    type: 'guess'
  })
}

// Method to show system messages (correct guesses, player joins, etc.)
const showSystemMessage = (message) => {
  addMessage({
    username: 'System',
    text: message,
    type: 'system'
  })
}

defineExpose({
  receiveMessage,
  showSystemMessage
})
</script>

<style scoped>
.chat-box {
  @apply flex flex-col h-[600px] bg-opacity-30 overflow-hidden;
}

.chat-header {
  @apply flex justify-between items-center px-4 py-3 bg-gray-800/80 text-white;
}

.chat-title {
  @apply text-lg font-vazir flex items-center;
}

.chat-status {
  @apply text-sm font-vazir px-2 py-1 rounded-full text-xs;
}

.status-active {
  @apply bg-green-500/20 text-green-300;
}

.status-inactive {
  @apply bg-yellow-500/20 text-yellow-300;
}

.messages {
  @apply flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/50;
}

.empty-messages {
  @apply flex items-center justify-center h-full;
}

.message {
  @apply p-3 rounded-lg transition-all duration-300 animate-[fadeIn_0.3s];
}

.message-header {
  @apply flex justify-between items-center mb-1 text-sm;
}

.message-content {
  @apply break-words;
}

.username {
  @apply font-bold;
}

.message-time {
  @apply text-xs text-gray-400;
}

.message.guess {
  @apply bg-gray-800/70 text-gray-100 border-r-4 border-primary-600;
}

.message.system {
  @apply bg-secondary-900/40 text-secondary-100 border-r-4 border-secondary-600;
}

.message-form {
  @apply p-3 bg-gray-800/80 flex gap-2 border-t border-gray-700;
}

.message-input {
  @apply flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}

.send-button {
  @apply p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 