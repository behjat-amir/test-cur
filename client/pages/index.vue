<template>
  <div class="home-container">
    <h1>Welcome to Gartic Clone</h1>
    
    <div class="actions">
      <div class="create-room">
        <h2>Create New Room</h2>
        <button @click="createRoom" class="btn-primary">
          Create Room
        </button>
      </div>

      <div class="join-room">
        <h2>Join Existing Room</h2>
        <div class="join-form">
          <input
            v-model="roomId"
            type="text"
            placeholder="Enter Room ID"
            class="room-input"
          />
          <button @click="joinRoom" class="btn-primary" :disabled="!roomId">
            Join Room
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const roomId = ref('')

const createRoom = () => {
  // Generate a random room ID
  const newRoomId = Math.random().toString(36).substring(2, 8)
  router.push(`/game/${newRoomId}`)
}

const joinRoom = () => {
  if (roomId.value) {
    router.push(`/game/${roomId.value}`)
  }
}
</script>

<style scoped>
.home-container {
  @apply max-w-2xl mx-auto p-8;
}

h1 {
  @apply text-4xl font-bold text-center mb-12;
}

.actions {
  @apply space-y-8;
}

h2 {
  @apply text-2xl font-semibold mb-4;
}

.create-room, .join-room {
  @apply bg-white p-6 rounded-lg shadow-md;
}

.join-form {
  @apply flex gap-4;
}

.room-input {
  @apply flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.btn-primary {
  @apply px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed;
}
</style> 