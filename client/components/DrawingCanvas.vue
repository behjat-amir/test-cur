<template>
  <div class="drawing-canvas-container">
    <div class="canvas-header" v-if="isDrawer">
      <div class="tool-badge">
        <span>{{ currentTool === 'brush' ? 'قلم نقاشی' : 'پاک کن' }}</span>
      </div>
      <div class="canvas-status">در حال نقاشی...</div>
    </div>
    <div class="canvas-wrapper">
      <canvas ref="canvas"></canvas>
      <div v-if="!isDrawer" class="spectator-overlay">
        <div class="spectator-message">در حال تماشای نقاشی...</div>
      </div>
    </div>
    <div class="tools" v-if="isDrawer">
      <div class="tools-header">ابزارها</div>
      <div class="tools-group">
        <button @click="setTool('brush')" :class="{ active: currentTool === 'brush' }" class="tool-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
            <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
          </svg>
          قلم
        </button>
        <button @click="setTool('eraser')" :class="{ active: currentTool === 'eraser' }" class="tool-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path fill-rule="evenodd" d="M16.098 2.598a3.75 3.75 0 113.622 6.275l-1.72.46V12a.75.75 0 01-.22.53l-.75.75a.75.75 0 01-1.06 0l-.97-.97-7.94 7.94a2.56 2.56 0 01-1.81.75 1.06 1.06 0 00-.75.31l-.97.97a.75.75 0 01-1.06 0l-.75-.75a.75.75 0 010-1.06l.97-.97a1.06 1.06 0 00.31-.75c0-.68.27-1.33.75-1.81L11.69 9l-.97-.97a.75.75 0 010-1.06l.75-.75A.75.75 0 0112 6h2.666l.461-1.72c.165-.617.49-1.2.971-1.682zm-3.348 7.463L4.81 18a1.06 1.06 0 00-.31.75c0 .318-.06.63-.172.922a2.56 2.56 0 01.922-.172c.281 0 .551-.112.75-.31l7.94-7.94-1.19-1.19z" clip-rule="evenodd" />
          </svg>
          پاک کن
        </button>
      </div>
      
      <div class="tools-group">
        <div class="color-picker">
          <label>رنگ</label>
          <input type="color" v-model="currentColor" class="color-input" />
        </div>
        
        <div class="size-picker">
          <label>اندازه: {{ brushSize }}</label>
          <input
            type="range"
            v-model="brushSize"
            min="1"
            max="20"
            class="brush-size"
          />
        </div>
      </div>
      
      <button @click="clearCanvas" class="clear-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 ml-1">
          <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
        </svg>
        پاک کردن بوم
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { fabric } from 'fabric'

const props = defineProps({
  isDrawer: {
    type: Boolean,
    default: false
  },
  roomId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['draw'])

const canvas = ref(null)
let fabricCanvas = null
const currentTool = ref('brush')
const currentColor = ref('#000000')
const brushSize = ref(5)
let isDrawing = false
let currentPath = null
let currentPathId = null

// Initialize canvas with proper dimensions
const initCanvas = () => {
  if (!canvas.value) return;
  
  const canvasContainer = canvas.value.parentElement;
  const width = canvasContainer.clientWidth;
  const height = 500; // Fixed height
  
  // Set canvas dimensions
  canvas.value.width = width;
  canvas.value.height = height;
  
  console.log('Initializing canvas, is drawer:', props.isDrawer);
  
  // Initialize Fabric canvas
  fabricCanvas = new fabric.Canvas(canvas.value, {
    isDrawingMode: props.isDrawer,
    selection: false, // Disable selection for all users
    backgroundColor: '#ffffff',
    width: width,
    height: height
  });
  
  // Set initial brush settings
  fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
  fabricCanvas.freeDrawingBrush.color = currentColor.value;
  fabricCanvas.freeDrawingBrush.width = parseInt(brushSize.value);
  
  // Make all objects non-selectable
  fabricCanvas.on('object:added', (e) => {
    if (e.target) {
      e.target.selectable = false;
      e.target.evented = false;
    }
  });

  // Handle real-time drawing events
  setupDrawingEvents();
}

// Setup drawing event handlers
const setupDrawingEvents = () => {
  if (!fabricCanvas) return;
  
  // Remove any existing event handlers to prevent duplicates
  fabricCanvas.off('mouse:down');
  fabricCanvas.off('mouse:move');
  fabricCanvas.off('mouse:up');
  fabricCanvas.off('path:created');
  
  // Only allow drawing for the current drawer
  fabricCanvas.isDrawingMode = props.isDrawer;
  
  // Emit draw start event on mouse down
  fabricCanvas.on('mouse:down', (options) => {
    if (!props.isDrawer) return;
    
    isDrawing = true;
    currentPathId = generatePathId();
    
    const pointer = fabricCanvas.getPointer(options.e);
    console.log('Mouse down at', pointer.x, pointer.y);
    
    emit('draw', {
      type: 'mousedown',
      roomId: props.roomId,
      pathId: currentPathId,
      pointer: pointer,
      color: fabricCanvas.freeDrawingBrush.color,
      width: fabricCanvas.freeDrawingBrush.width
    });
  });
  
  // Emit draw move event on mouse move
  fabricCanvas.on('mouse:move', (options) => {
    if (!isDrawing || !props.isDrawer) return;
    
    const pointer = fabricCanvas.getPointer(options.e);
    emit('draw', {
      type: 'mousemove',
      roomId: props.roomId,
      pathId: currentPathId,
      pointer: pointer
    });
  });
  
  // Emit draw end event on mouse up
  fabricCanvas.on('mouse:up', () => {
    if (!props.isDrawer) return;
    
    isDrawing = false;
    console.log('Mouse up, path complete');
    
    emit('draw', {
      type: 'mouseup',
      roomId: props.roomId,
      pathId: currentPathId
    });
    
    currentPathId = null;
  });
  
  // Also track the path:created event for backup
  fabricCanvas.on('path:created', (e) => {
    if (!props.isDrawer) return;
    
    console.log('Path created');
    emit('draw', {
      type: 'path',
      roomId: props.roomId,
      path: e.path.toJSON()
    });
  });
}

// Watch for changes in drawer status
watch(() => props.isDrawer, (newValue) => {
  console.log('Drawer status changed to:', newValue);
  
  if (fabricCanvas) {
    fabricCanvas.isDrawingMode = newValue;
    
    // Reset any ongoing drawing if no longer drawer
    if (!newValue && isDrawing) {
      isDrawing = false;
      currentPathId = null;
    }
    
    // Update drawing events
    setupDrawingEvents();
    fabricCanvas.renderAll();
  }
}, { immediate: true })

// Generate a unique ID for paths
const generatePathId = () => {
  return Math.random().toString(36).substring(2, 15);
}

onMounted(() => {
  console.log('DrawingCanvas mounted');
  window.addEventListener('resize', handleResize);
  // Initialize canvas after DOM is fully rendered
  setTimeout(initCanvas, 100);
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (fabricCanvas) {
    fabricCanvas.dispose();
  }
})

const handleResize = () => {
  if (!fabricCanvas) return;
  
  const canvasContainer = canvas.value.parentElement;
  const width = canvasContainer.clientWidth;
  const height = 500;
  
  fabricCanvas.setWidth(width);
  fabricCanvas.setHeight(height);
  fabricCanvas.renderAll();
}

watch(currentColor, (newColor) => {
  if (fabricCanvas && props.isDrawer) {
    fabricCanvas.freeDrawingBrush.color = newColor;
  }
})

watch(brushSize, (newSize) => {
  if (fabricCanvas && props.isDrawer) {
    fabricCanvas.freeDrawingBrush.width = parseInt(newSize);
  }
})

const setTool = (tool) => {
  if (!props.isDrawer || !fabricCanvas) return;
  
  currentTool.value = tool;
  if (tool === 'eraser') {
    fabricCanvas.freeDrawingBrush.color = '#ffffff';
  } else {
    fabricCanvas.freeDrawingBrush.color = currentColor.value;
  }
}

const clearCanvas = () => {
  if (!fabricCanvas) return;
  
  // Clear all objects and paths
  fabricCanvas.clear();
  fabricCanvas.backgroundColor = '#ffffff';
  activePaths.clear(); // Clear active paths map
  fabricCanvas.renderAll();
  
  // Notify others that canvas was cleared if we're the drawer
  if (props.isDrawer) {
    emit('draw', {
      type: 'clear',
      roomId: props.roomId
    });
  }
}

// Track active paths by ID for real-time drawing
const activePaths = new Map();

// Method to receive drawing data from other players
const receiveDrawing = (drawData) => {
  if (!fabricCanvas) {
    console.error('Fabric canvas not initialized for receiving drawings');
    return;
  }

  console.log('Processing drawing data:', drawData.type);

  // Handle different drawing event types
  switch (drawData.type) {
    case 'clear':
      console.log('Clearing canvas from remote command');
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';
      activePaths.clear();
      fabricCanvas.renderAll();
      break;
      
    case 'path':
      console.log('Adding complete path');
      fabric.util.enlivenObjects([drawData.path], (objects) => {
        objects.forEach((obj) => {
          obj.selectable = false;
          obj.evented = false;
          fabricCanvas.add(obj);
          fabricCanvas.renderAll();
        });
      });
      break;
      
    case 'mousedown':
      console.log('Starting new path at', drawData.pointer.x, drawData.pointer.y);
      const newPath = new fabric.Path(`M ${drawData.pointer.x} ${drawData.pointer.y}`, {
        stroke: drawData.color,
        strokeWidth: drawData.width,
        fill: '',
        selectable: false,
        evented: false
      });
      activePaths.set(drawData.pathId, { 
        path: newPath,
        lastX: drawData.pointer.x,
        lastY: drawData.pointer.y
      });
      fabricCanvas.add(newPath);
      fabricCanvas.renderAll();
      break;
      
    case 'mousemove':
      const existingPathData = activePaths.get(drawData.pathId);
      if (existingPathData) {
        try {
          const { path, lastX, lastY } = existingPathData;
          // Add line segment only if the point is different from the last one
          if (lastX !== drawData.pointer.x || lastY !== drawData.pointer.y) {
            path.path.push(['L', drawData.pointer.x, drawData.pointer.y]);
            existingPathData.lastX = drawData.pointer.x;
            existingPathData.lastY = drawData.pointer.y;
            path.dirty = true;
            fabricCanvas.renderAll();
          }
        } catch (error) {
          console.error('Error updating path:', error);
          // Remove problematic path
          const problemPath = activePaths.get(drawData.pathId);
          if (problemPath) {
            fabricCanvas.remove(problemPath.path);
            activePaths.delete(drawData.pathId);
          }
        }
      }
      break;
      
    case 'mouseup':
      console.log('Finishing path');
      const finishedPathData = activePaths.get(drawData.pathId);
      if (finishedPathData) {
        // Keep the path on canvas but remove from active paths
        activePaths.delete(drawData.pathId);
        fabricCanvas.renderAll();
      }
      break;
  }
}

defineExpose({
  receiveDrawing,
  clearCanvas
})
</script>

<style scoped>
.drawing-canvas-container {
  @apply flex flex-col w-full bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700;
}

.canvas-header {
  @apply flex justify-between items-center p-3 bg-gray-800/80;
}

.tool-badge {
  @apply bg-primary-600/20 text-primary-300 px-3 py-1 rounded-full text-sm font-vazir;
}

.canvas-status {
  @apply text-sm text-gray-300 font-vazir;
}

.canvas-wrapper {
  @apply w-full bg-white rounded-md relative;
  height: 500px;
}

.spectator-overlay {
  @apply absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none;
}

.spectator-message {
  @apply bg-gray-800/70 text-white px-4 py-2 rounded-lg text-sm font-vazir;
}

canvas {
  @apply absolute top-0 left-0 w-full h-full;
  touch-action: none;
}

.tools {
  @apply p-4 bg-gray-800/80 space-y-4 border-t border-gray-700;
}

.tools-header {
  @apply text-sm text-gray-400 mb-2 font-vazir;
}

.tools-group {
  @apply flex flex-wrap gap-3 items-center;
}

.tool-btn {
  @apply flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors;
}

.tool-btn.active {
  @apply bg-primary-600 text-white;
}

.color-picker {
  @apply flex flex-col gap-1;
}

.color-picker label {
  @apply text-sm text-gray-300 font-vazir;
}

.color-input {
  @apply w-10 h-10 rounded-full overflow-hidden border-2 border-gray-600 cursor-pointer;
  padding: 0;
}

.size-picker {
  @apply flex flex-col gap-1 flex-grow;
}

.size-picker label {
  @apply text-sm text-gray-300 font-vazir;
}

.brush-size {
  @apply w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer;
}

.brush-size::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 rounded-full bg-primary-500;
}

.clear-btn {
  @apply mt-4 w-full flex items-center justify-center gap-1 px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-700 transition-colors;
}

@media (max-width: 768px) {
  .tools-group {
    @apply flex-col items-stretch;
  }
}
</style> 