<template>
  <div class="game-container">
    <div class="game-header">
      <div class="game-info">
        <h1>Room: {{ roomId }}</h1>
        <div class="timer-container" v-if="timeLeft > 0">
          <div class="timer-info">
            <span class="timer-text">{{ timeLeft }}s</span>
            <span v-if="isDrawer" class="word-to-draw">{{ currentWord }}</span>
          </div>
          <div class="timer-bar-container">
            <div class="timer-bar" :style="{ width: `${(timeLeft / roundDuration) * 100}%`, backgroundColor: getTimerColor() }"></div>
          </div>
        </div>
        <div v-if="isDrawer && !timeLeft" class="word-to-draw">
          Word to draw: {{ currentWord }}
        </div>
      </div>
      <div class="scores">
        <div v-for="player in players" :key="player.id" class="player-score">
          {{ player.username }}: {{ player.score }}
          <span v-if="player.id === currentDrawer" class="drawer-badge">
            (Drawing)
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
      />
      <ChatBox
        ref="chatBox"
        :is-drawer="isDrawer"
        @guess="handleGuess"
      />
    </div>

    <!-- Round End Overlay -->
    <Transition name="fade">
      <div v-if="showRoundEnd" class="round-end-overlay">
        <div class="round-end-content">
          <h2>Round Complete!</h2>
          <p>The word was: {{ roundEndWord }}</p>
          <div class="scores-update">
            <div v-for="player in roundEndScores" :key="player.id">
              {{ player.username }}: {{ player.score }}
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- New Round Overlay -->
    <Transition name="fade">
      <div v-if="showNewRound" class="new-round-overlay">
        <div class="new-round-content">
          <h2>New Round Starting!</h2>
          <p>{{ newRoundDrawer }} will be drawing next</p>
          <p v-if="previousWord">Previous word was: {{ previousWord }}</p>
        </div>
      </div>
    </Transition>

    <!-- Time's Up Overlay -->
    <Transition name="zoom-fade">
      <div v-if="showTimeUp" class="times-up-overlay">
        <div class="times-up-content">
          <h2>Time's Up!</h2>
          <p>The word was: {{ currentTimeUpWord }}</p>
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
  // In a real app, you'd get the username from a login system
  username.value = 'Player_' + Math.floor(Math.random() * 1000)
  
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
  chatBox.value?.showSystemMessage(`${data.username} guessed correctly!`)
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
  
  // Clear canvas when a new round starts or drawer changes
  if (!data.roundInProgress) {
    console.log('Round not in progress, clearing canvas');
    drawingCanvas.value?.clearCanvas();
  }
})

socket.on('error', (message) => {
  chatBox.value?.showSystemMessage(`Error: ${message}`)
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
    currentTimeUpWord.value = roundEndWord.value || 'Unknown'; // Use the current word if available
    
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
  @apply max-w-7xl mx-auto p-4;
}

.game-header {
  @apply flex justify-between items-center mb-4;
}

.game-info {
  @apply space-y-2;
}

.game-info h1 {
  @apply text-2xl font-bold;
}

.timer-container {
  @apply w-full mt-2;
}

.timer-info {
  @apply flex justify-between items-center mb-1;
}

.timer-text {
  @apply text-lg font-semibold;
}

.timer-bar-container {
  @apply w-full bg-gray-200 rounded-full h-2.5 overflow-hidden;
}

.timer-bar {
  @apply h-full rounded-full transition-all duration-1000 ease-linear;
}

.word-to-draw {
  @apply text-lg font-semibold text-blue-600;
}

.scores {
  @apply space-y-1;
}

.player-score {
  @apply text-lg;
}

.drawer-badge {
  @apply ml-2 text-sm text-blue-600 font-semibold;
}

.game-content {
  @apply grid grid-cols-2 gap-4;
}

.round-end-overlay,
.new-round-overlay {
  @apply fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50;
}

.round-end-content,
.new-round-content {
  @apply bg-white rounded-lg p-8 text-center max-w-md w-full mx-4;
}

.round-end-content h2,
.new-round-content h2 {
  @apply text-2xl font-bold mb-4 text-blue-600;
}

.round-end-content p,
.new-round-content p {
  @apply text-lg mb-4;
}

.scores-update {
  @apply space-y-2 text-lg;
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

.times-up-overlay {
  @apply fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50;
}

.times-up-content {
  @apply bg-white rounded-lg p-8 text-center max-w-md w-full mx-4 flex flex-col items-center;
}

.times-up-content h2 {
  @apply text-3xl font-bold mb-4 text-red-600;
}

.countdown {
  @apply relative w-24 h-24 mt-4;
}

.countdown-number {
  @apply absolute inset-0 flex items-center justify-center text-4xl font-bold;
}

.countdown-circle {
  fill: none;
  stroke: #4CAF50;
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
</style> 