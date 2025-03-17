<template>
  <div class="chat-box">
    <div class="messages" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.type]"
      >
        <span class="username">{{ message.username }}:</span>
        {{ message.text }}
      </div>
    </div>
    <form @submit.prevent="sendMessage" class="message-form">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type your guess..."
        :disabled="isDrawer"
      />
      <button type="submit" :disabled="isDrawer">Send</button>
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

const addMessage = (message) => {
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
  @apply flex flex-col h-[600px] border-2 border-gray-300 rounded-lg;
}

.messages {
  @apply flex-1 overflow-y-auto p-4 space-y-2;
}

.message {
  @apply p-2 rounded;
}

.message .username {
  @apply font-bold mr-2;
}

.message.guess {
  @apply bg-gray-100;
}

.message.system {
  @apply bg-blue-100 text-blue-800;
}

.message-form {
  @apply p-4 border-t border-gray-300 flex gap-2;
}

.message-form input {
  @apply flex-1 px-4 py-2 border border-gray-300 rounded;
}

.message-form button {
  @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400;
}
</style> 