<template>
  <div class="drawing-canvas-container">
    <div class="canvas-wrapper">
      <canvas ref="canvas"></canvas>
    </div>
    <div class="tools" v-if="isDrawer">
      <button @click="setTool('brush')" :class="{ active: currentTool === 'brush' }">
        Brush
      </button>
      <button @click="setTool('eraser')" :class="{ active: currentTool === 'eraser' }">
        Eraser
      </button>
      <input type="color" v-model="currentColor" />
      <input
        type="range"
        v-model="brushSize"
        min="1"
        max="20"
        class="brush-size"
      />
      <button @click="clearCanvas" class="clear-btn">
        Clear Canvas
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
  @apply flex flex-col w-full border-2 border-gray-300 rounded-lg p-2;
}

.canvas-wrapper {
  @apply w-full bg-white rounded;
  height: 500px;
  position: relative;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.tools {
  @apply flex gap-4 mt-4 items-center flex-wrap;
}

.tools button {
  @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600;
}

.tools button.active {
  @apply bg-blue-700;
}

.clear-btn {
  @apply bg-red-500 hover:bg-red-600;
}

.brush-size {
  @apply w-32;
}
</style> 