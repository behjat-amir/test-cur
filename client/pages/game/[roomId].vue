<template>
  <div class="game-container">
    <div class="game-card p-6 relative overflow-hidden">
      <!-- زمینه متحرک -->
      <div class="absolute inset-0 -z-10 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-gray-900 to-secondary-900/30"></div>
        <div class="absolute -inset-[10px] opacity-30">
          <div class="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-500/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div class="absolute top-3/4 right-1/4 w-40 h-40 bg-secondary-500/20 rounded-full filter blur-3xl animate-pulse-slow delay-1000"></div>
        </div>
      </div>

      <div class="game-header">
        <div class="game-info">
          <h1 class="font-titr text-2xl text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-accent-400">
            اتاق: {{ roomId }}
          </h1>
          <div class="timer-container bg-gray-800/50 p-3 rounded-lg border border-gray-700 shadow-lg" v-if="timeLeft > 0">
            <div class="timer-info">
              <span class="timer-text">{{ timeLeft }} ثانیه</span>
              <span v-if="isDrawer" class="text-lg font-bold text-primary-300">کلمه: {{ currentWord }}</span>
            </div>
            <div class="timer-bar-container">
              <div class="timer-bar" :style="{ width: `${(timeLeft / roundDuration) * 100}%`, backgroundColor: getTimerColor() }"></div>
            </div>
          </div>
          <div v-if="isDrawer && !timeLeft" class="text-lg font-bold text-primary-300">
            کلمه برای نقاشی: {{ currentWord }}
          </div>
        </div>
        <div class="scores">
          <h3 class="text-lg mb-2 text-gray-300 border-b border-gray-700 pb-1">امتیازات</h3>
          <div v-for="player in players" :key="player.id" class="player-score">
            {{ player.username }}: {{ player.score }}
            <span v-if="player.id === currentDrawer" class="drawer-badge">
              (در حال نقاشی)
            </span>
          </div>
        </div>
      </div>

      <div class="game-content">
        <DrawingCanvas
          ref="drawingCanvas"
          :is-drawer="isDrawer"
          :room-id="roomId"
          @draw="handleDraw"
          class="neon-border"
        />
        <ChatBox
          ref="chatBox"
          :is-drawer="isDrawer"
          @guess="handleGuess"
          class="chat-box-container"
        />
      </div>
    </div>

    <!-- Round End Overlay -->
    <Transition name="fade">
      <div v-if="showRoundEnd" class="round-end-overlay">
        <div class="round-end-content">
          <h2>پایان راند!</h2>
          <p>کلمه مورد نظر: <span class="text-accent-400 font-bold">{{ roundEndWord }}</span></p>
          <div class="scores-update">
            <h3 class="mb-2 font-vazir text-gray-400">امتیازات</h3>
            <div v-for="player in roundEndScores" :key="player.id" class="flex justify-between items-center">
              <span>{{ player.username }}</span>
              <span class="bg-primary-500/20 px-2 py-1 rounded text-primary-300">{{ player.score }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- New Round Overlay -->
    <Transition name="fade">
      <div v-if="showNewRound" class="new-round-overlay">
        <div class="new-round-content">
          <h2>راند جدید!</h2>
          <div class="relative w-24 h-24 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full text-secondary-400 animate-float">
              <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
              <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
            </svg>
          </div>
          <p class="text-xl mb-2">نقاش بعدی: <span class="text-secondary-300 font-bold">{{ newRoundDrawer }}</span></p>
          <p v-if="previousWord" class="text-gray-400">کلمه قبلی: <span class="text-accent-300">{{ previousWord }}</span></p>
        </div>
      </div>
    </Transition>

    <!-- Time's Up Overlay -->
    <Transition name="zoom-fade">
      <div v-if="showTimeUp" class="times-up-overlay">
        <div class="times-up-content">
          <h2>وقت تمام شد!</h2>
          <p>کلمه مورد نظر: <span class="text-accent-400 font-bold">{{ currentTimeUpWord }}</span></p>
          <div class="countdown">
            <div class="countdown-number">{{ countdownValue }}</div>
            <svg viewBox="0 0 100 100">
              <circle class="countdown-circle" r="45" cx="50" cy="50" />
            </svg>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { io } from 'socket.io-client'
import { useRoute } from 'vue-router'

const config = useRuntimeConfig()
const route = useRoute()

const socket = io(config.public.socketUrl)
const roomId = route.params.roomId
const username = ref('')
const players = ref([])
const isDrawer = ref(false)
const currentWord = ref('')
const timeLeft = ref(0)
const currentDrawer = ref(null)
const drawingCanvas = ref(null)
const chatBox = ref(null)
const showRoundEnd = ref(false)
const roundEndWord = ref('')
const roundEndScores = ref([])
const showNewRound = ref(false)
const newRoundDrawer = ref('')
const previousWord = ref('')
const roundDuration = ref(80)
const showTimeUp = ref(false)
const currentTimeUpWord = ref('')
const countdownValue = ref(3)

// Join room on mount
onMounted(async () => {
  // Get username from localStorage or generate a random one
  username.value = localStorage.getItem('username') || 'کاربر_' + Math.floor(Math.random() * 1000)
  
  socket.emit('joinRoom', {
    roomId,
    username: username.value
  })
})

// Socket event handlers
socket.on('playerJoined', (data) => {
  players.value = data.players
  chatBox.value?.showSystemMessage(data.message)
})

socket.on('playerLeft', (data) => {
  players.value = data.players
  chatBox.value?.showSystemMessage(data.message)
})

socket.on('drawing', (drawData) => {
  console.log('Received drawing data:', drawData.type);
  if (drawingCanvas.value) {
    drawingCanvas.value.receiveDrawing(drawData);
  } else {
    console.error('Drawing canvas ref is not available');
  }
})

socket.on('newGuess', (data) => {
  chatBox.value?.receiveMessage(data)
})

socket.on('correctGuess', (data) => {
  players.value = data.scores
  chatBox.value?.showSystemMessage(`${data.username} حدس درست زد!`)
})

socket.on('systemMessage', (data) => {
  chatBox.value?.showSystemMessage(data.message)
})

socket.on('gameState', (data) => {
  console.log('Game state update, current drawer:', data.currentDrawer);
  currentDrawer.value = data.currentDrawer;
  isDrawer.value = data.currentDrawer === socket.id;
  players.value = data.players;
  
  if (isDrawer.value) {
    currentWord.value = data.word || '';
    console.log('I am the drawer now! Word:', currentWord.value);
  } else {
    currentWord.value = '';
    console.log('I am not the drawer');
  }
  timeLeft.value = data.timeLeft;
  roundDuration.value = data.roundDuration || 80;
  
  // Clear canvas when a new round starts
  if (!data.roundInProgress) {
    console.log('Round not in progress, clearing canvas');
    drawingCanvas.value?.clearCanvas();
  }
})

socket.on('error', (message) => {
  chatBox.value?.showSystemMessage(`خطا: ${message}`)
})

socket.on('roundEnd', (data) => {
  roundEndWord.value = data.word
  roundEndScores.value = data.scores
  showRoundEnd.value = true
  currentTimeUpWord.value = data.word // Set the current word for time's up animation
  
  // Clear canvas immediately when round ends
  drawingCanvas.value?.clearCanvas()
  
  // Hide round end overlay after 4 seconds
  setTimeout(() => {
    showRoundEnd.value = false
  }, 4000)
})

socket.on('newRound', (data) => {
  newRoundDrawer.value = data.drawer
  previousWord.value = data.previousWord
  showNewRound.value = true
  
  // Clear canvas when new round starts
  drawingCanvas.value?.clearCanvas()
  
  // Hide new round overlay after 4 seconds
  setTimeout(() => {
    showNewRound.value = false
  }, 4000)
})

// Event handlers
const handleDraw = (drawData) => {
  // Only the current drawer should send drawing data
  // Exception: clear canvas event can be sent by anyone
  if (isDrawer.value || (drawData.type === 'clear' && !isDrawer.value)) {
    console.log('Sending draw event:', drawData.type);
    socket.emit('draw', drawData);
  } else {
    console.log('Not the drawer, ignoring draw event:', drawData.type);
  }
}

const handleGuess = (guess) => {
  if (!isDrawer.value) {
    socket.emit('guess', {
      roomId,
      guess,
      username: username.value
    })
  }
}

// Compute timer color based on remaining time
const getTimerColor = () => {
  const percentage = timeLeft.value / roundDuration.value;
  if (percentage > 0.6) return '#4CAF50'; // Green
  if (percentage > 0.3) return '#FFC107'; // Yellow/Orange
  return '#F44336'; // Red for last 30%
}

// Watch for timeLeft changes to show Time's Up animation
watch(timeLeft, (newVal, oldVal) => {
  // If time just ran out (old value was > 0, new value is 0)
  if (oldVal > 0 && newVal === 0 && !showTimeUp.value) {
    // Show time's up animation
    showTimeUp.value = true;
    currentTimeUpWord.value = roundEndWord.value || 'نامشخص';
    
    // Start countdown
    countdownValue.value = 3;
    const countdownTimer = setInterval(() => {
      countdownValue.value--;
      if (countdownValue.value <= 0) {
        clearInterval(countdownTimer);
        showTimeUp.value = false;
      }
    }, 1000);
  }
});

// Cleanup on unmount
onUnmounted(() => {
  socket.disconnect()
})
</script>

<style scoped>
.game-container {
  @apply container mx-auto p-4 md:p-6 min-h-screen;
}

.game-header {
  @apply flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4;
}

.game-info {
  @apply space-y-3 w-full md:w-2/3;
}

.timer-container {
  @apply w-full mt-2;
}

.timer-info {
  @apply flex justify-between items-center mb-2;
}

.timer-text {
  @apply text-lg font-vazir font-semibold text-white;
}

.timer-bar-container {
  @apply w-full bg-gray-700 rounded-full h-3 overflow-hidden;
}

.timer-bar {
  @apply h-full rounded-full transition-all duration-1000 ease-linear;
}

.scores {
  @apply bg-gray-800/60 p-4 rounded-lg border border-gray-700 shadow-lg w-full md:w-1/3;
}

.player-score {
  @apply py-1 px-2 rounded-md text-lg mb-1 flex justify-between items-center bg-gray-800/40;
}

.drawer-badge {
  @apply mr-2 text-sm bg-primary-500/30 text-primary-300 px-2 py-0.5 rounded-full font-semibold;
}

.game-content {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.round-end-overlay,
.new-round-overlay,
.times-up-overlay {
  @apply fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-50;
}

.round-end-content,
.new-round-content,
.times-up-content {
  @apply bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8 text-center max-w-md w-full mx-4;
}

.round-end-content h2,
.new-round-content h2,
.times-up-content h2 {
  @apply text-2xl font-titr mb-6 text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-secondary-400;
}

.round-end-content p,
.new-round-content p,
.times-up-content p {
  @apply text-lg mb-6 text-gray-200;
}

.scores-update {
  @apply space-y-2 text-lg mt-4 p-4 bg-gray-800/70 rounded-lg;
}

.countdown {
  @apply relative w-24 h-24 mt-4 mx-auto;
}

.countdown-number {
  @apply absolute inset-0 flex items-center justify-center text-4xl font-bold text-primary-300;
}

.countdown-circle {
  fill: none;
  stroke: theme('colors.primary.500');
  stroke-width: 8;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: center;
  stroke-dasharray: 283;
  stroke-dashoffset: 0;
  animation: countdown 3s linear forwards;
}

@keyframes countdown {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: 283;
  }
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-500;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

/* Zoom fade animation */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  @apply transition-all duration-500;
}

.zoom-fade-enter-from {
  @apply opacity-0 scale-150;
}

.zoom-fade-leave-to {
  @apply opacity-0 scale-75;
}

@media (max-width: 768px) {
  .game-content {
    grid-template-rows: 400px 1fr;
  }
}

.game-card {
  @apply bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl;
}

.chat-box-container {
  @apply bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl;
}
</style> 