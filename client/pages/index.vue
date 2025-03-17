<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
    <div class="relative w-full max-w-4xl mx-auto">
      <!-- زمینه متحرک -->
      <div class="absolute inset-0 -z-10 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-gray-900 to-secondary-900/30"></div>
        <div class="absolute -inset-[10px] opacity-50">
          <div class="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-500/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div class="absolute top-3/4 right-1/4 w-40 h-40 bg-secondary-500/20 rounded-full filter blur-3xl animate-pulse-slow delay-1000"></div>
          <div class="absolute bottom-1/4 left-1/2 w-36 h-36 bg-accent-500/20 rounded-full filter blur-3xl animate-pulse-slow delay-500"></div>
        </div>
      </div>

      <div class="glass-card p-8 md:p-12">
        <div class="text-center mb-10">
          <h1 class="title inline-block animate-float">
            <span class="flex items-center gap-3 justify-center">
              <div class="h-10 w-10 md:h-14 md:w-14 relative">
                <div class="absolute inset-0 bg-primary-500 rounded-full opacity-20 animate-ping"></div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="text-primary-400 w-full h-full">
                  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
                  <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
                </svg>
              </div>
              بازی نقاشی آنلاین
            </span>
          </h1>
          <p class="subtitle">با دوستان خود نقاشی بکشید و حدس بزنید!</p>
        </div>

        <div class="max-w-md mx-auto space-y-6">
          <div class="card">
            <h2 class="text-xl font-vazir font-bold text-center mb-6 text-primary-300">ایجاد اتاق جدید</h2>
            <div class="space-y-4">
              <div>
                <label for="username" class="block text-sm font-medium text-gray-300 mb-1">نام کاربری</label>
                <input 
                  type="text" 
                  id="username" 
                  v-model="username" 
                  class="input" 
                  placeholder="نام خود را وارد کنید"
                />
              </div>
              <button @click="createRoom" class="btn-primary w-full flex items-center justify-center gap-2">
                <span>ایجاد اتاق</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-800 text-gray-400">یا</span>
            </div>
          </div>

          <div class="card">
            <h2 class="text-xl font-vazir font-bold text-center mb-6 text-secondary-300">پیوستن به اتاق</h2>
            <div class="space-y-4">
              <div>
                <label for="join-username" class="block text-sm font-medium text-gray-300 mb-1">نام کاربری</label>
                <input 
                  type="text" 
                  id="join-username" 
                  v-model="username" 
                  class="input" 
                  placeholder="نام خود را وارد کنید"
                />
              </div>
              <div>
                <label for="roomId" class="block text-sm font-medium text-gray-300 mb-1">کد اتاق</label>
                <input 
                  type="text" 
                  id="roomId" 
                  v-model="roomId" 
                  class="input" 
                  placeholder="کد اتاق را وارد کنید"
                />
              </div>
              <button @click="joinRoom" class="btn-secondary w-full flex items-center justify-center gap-2">
                <span>پیوستن به اتاق</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-8 text-center text-gray-400 text-sm">
        <p>با استفاده از تکنولوژی‌های Node.js، Vue.js و Socket.IO</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const roomId = ref('')

const createRoom = () => {
  if (!username.value) {
    alert('لطفاً یک نام کاربری وارد کنید')
    return
  }
  
  // اتاق جدید به صورت کد تصادفی
  roomId.value = Math.random().toString(36).substring(2, 8)
  joinRoom()
}

const joinRoom = () => {
  if (!username.value) {
    alert('لطفاً یک نام کاربری وارد کنید')
    return
  }
  
  if (!roomId.value) {
    alert('لطفاً کد اتاق را وارد کنید')
    return
  }
  
  localStorage.setItem('username', username.value)
  router.push(`/game/${roomId.value}`)
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