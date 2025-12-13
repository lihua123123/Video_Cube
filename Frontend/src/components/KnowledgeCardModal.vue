<template>
  <transition name="modal-fade">
    <div 
      class="knowledge-card-modal-overlay" 
      v-if="isVisible" 
      @click="handleOverlayClick"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        class="knowledge-card-modal-content" 
        @click.stop
        @mousedown="handleDragStart"
        ref="modalContentRef"
        :class="{ 'is-dragging': isDragging, 'is-draggable': draggable }"
        :style="modalStyle"
      >
        <!-- Premium close and header buttons with smooth animations -->
        <button class="close-button" @click="handleClose" aria-label="关闭">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        
        <div class="knowledge-card-modal-header">
          <!-- 卡片导航（如果有多个卡片） -->
          <div v-if="cards.length > 1" class="cards-navigation">
            <span class="current-index">{{ currentIndex + 1 }} / {{ cards.length }}</span>
            <div class="nav-buttons">
              <button 
                class="nav-btn prev-btn" 
                @click="navigateToPrevious"
                :disabled="currentIndex === 0"
                aria-label="上一个卡片"
                @keydown.space.prevent="navigateToPrevious"
                @keydown.enter.prevent="navigateToPrevious"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <button 
                class="nav-btn next-btn" 
                @click="navigateToNext"
                :disabled="currentIndex === cards.length - 1"
                aria-label="下一个卡片"
                @keydown.space.prevent="navigateToNext"
                @keydown.enter.prevent="navigateToNext"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- 卡片时间范围 -->
          <div class="card-time-range" v-if="currentCard">
            {{ formatTime(currentCard.startTime) }} - {{ formatTime(currentCard.endTime) }}
          </div>
        </div>
        
        <div class="knowledge-card-modal-body" v-if="currentCard">
          <div class="card-title-container">
            <h3 class="card-title" id="modal-title">{{ currentCard.title }}</h3>
            <div v-if="currentCard.is_ai_generated" class="ai-badge">🤖 AI生成</div>
          </div>
          
          <!-- 卡片内容区域，添加淡入效果 -->
          <transition name="content-fade">
            <div 
              :key="currentCard.id || currentIndex"
              class="card-content" 
              v-html="processedContent"
              @click="handleContentClick"
            ></div>
          </transition>
          
          <!-- 操作按钮区域 -->
          <div class="card-actions">
            <button 
              class="action-btn details-btn" 
              @click="viewCardDetails"
              :class="{ 'pulse': cards.length > 1 }"
              aria-label="查看详情"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              查看详情
            </button>
            <button 
              class="action-btn close-btn" 
              @click="handleClose"
              aria-label="关闭"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              关闭
            </button>
          </div>
        </div>
        
        <!-- 调整尺寸手柄 -->
        <div 
          v-if="draggable" 
          class="resize-handle"
          @mousedown="handleResizeStart"
          title="拖动调整大小"
          aria-label="调整尺寸"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22M22 18H20V16H22V18M18 22H16V20H18V22M18 18H16V16H18V18M14 22H12V20H14V22M22 14H20V12H22V14Z"/>
          </svg>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true // 启用 GitHub Flavored Markdown
});

// 定义卡片类型
interface Card {
  id?: string | number;
  video_id?: number;
  startTime: number;
  endTime: number;
  title: string;
  content: string;
  content_type?: string;
  display_style?: string;
  is_ai_generated?: boolean;
  created_at?: string;
}

// 定义属性
const props = withDefaults(defineProps<{
  isVisible: boolean;
  cards: Card[];
  draggable?: boolean;
}>(), {
  draggable: true
});

// 模板引用
const modalContentRef = ref<HTMLElement>();

// 定义事件
const emit = defineEmits<{
  close: [];
  viewDetails: [card: Card];
  linkClick: [url: string];
}>();

// 当前显示的卡片索引
const currentIndex = ref(0);

// 当前显示的卡片
const currentCard = computed(() => {
  if (!props.cards.length) return null;
  return props.cards[currentIndex.value];
});

// 处理卡片内容，使用 marked 和 DOMPurify 优化
const processedContent = computed(() => {
  if (!currentCard.value?.content) return '';
  
  try {
    let html = marked.parse(currentCard.value.content) as string;
    
    // 修复图片 URL
    html = html.replace(/<img([^>]*)src="([^"\s]+)"([^>]*)>/gi, (match, before, url, after) => {
      let imageUrl = url;
      
      // 修复旧的 localhost:5173 URL
      if (url.includes('localhost:5173/uploads/')) {
        imageUrl = url.replace('http://localhost:5173/uploads/', 'http://localhost:3000/uploads/');
      }
      // 处理完整URL
      else if (url.startsWith('http://') || url.startsWith('https://')) {
        imageUrl = url;
      }
      // 处理 /uploads/ 开头的相对路径
      else if (url.startsWith('/uploads/')) {
        imageUrl = 'http://localhost:3000' + url;
      }
      // 处理没有 / 开头的相对路径
      else if (!url.startsWith('/')) {
        imageUrl = 'http://localhost:3000/' + url;
      }
      
      return `<img${before}src="${imageUrl}"${after} class="card-image" loading="lazy">`;
    });
    
    // 为链接添加类名和目标属性
    html = html.replace(/<a(?![^>]*class=)/g, '<a class="card-link"');
    html = html.replace(/<a(?![^>]*target=)/g, '<a target="_blank" rel="noopener noreferrer"');
    
    // 使用 DOMPurify 清理 HTML (防止 XSS 攻击)
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'del', 's', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'hr', 'mark', 'table', 'thead', 
                     'tbody', 'tr', 'th', 'td', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'loading']
    });
  } catch (error) {
    console.error('❌ Markdown 渲染失败:', error);
    // 如果解析失败,返回纯文本(转义HTML)
    const div = document.createElement('div');
    div.textContent = currentCard.value.content;
    return div.innerHTML;
  }
});

// 监听卡片数组变化，重置索引
watch(() => props.cards, () => {
  currentIndex.value = 0;
}, { deep: true });

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 导航到上一个卡片
const navigateToPrevious = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

// 导航到下一个卡片
const navigateToNext = () => {
  if (currentIndex.value < props.cards.length - 1) {
    currentIndex.value++;
  }
};

// 查看卡片详情
const viewCardDetails = () => {
  if (currentCard.value) {
    emit('viewDetails', currentCard.value);
  }
};

// 处理关闭事件
const handleClose = () => {
  emit('close');
};

// 处理遮罩层点击
const handleOverlayClick = () => {
  handleClose();
};

// 处理内容点击事件
const handleContentClick = (event: Event) => {
  const target = event.target as HTMLElement;
  if (target.tagName === 'A' && target.classList.contains('card-link')) {
    event.preventDefault();
    const url = target.getAttribute('href');
    if (url) {
      emit('linkClick', url);
    }
  }
};

// 键盘导航支持
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      handleClose();
      break;
    case 'ArrowLeft':
      navigateToPrevious();
      break;
    case 'ArrowRight':
      navigateToNext();
      break;
  }
};

// 拖动相关状态
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const modalX = ref(50);
const modalY = ref(50);
const isPositioned = ref(false);

// 尺寸调整相关状态
const isResizing = ref(false);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const modalWidth = ref(500);
const modalHeight = ref(600);
const minWidth = ref(320);
const minHeight = ref(400);
const maxWidth = ref(800);
const maxHeight = ref(900);

// 计算缩放比例
const scaleRatio = computed(() => {
  if (modalWidth.value === 0) return 1;
  const baseWidth = 500; // 基准宽度
  const ratio = modalWidth.value / baseWidth;
  // 限制缩放比例在 0.8 到 1.5 之间
  return Math.max(0.8, Math.min(1.5, ratio));
});

// 初始化位置
const initPosition = () => {
  if (!modalContentRef.value || isPositioned.value) return;
  
  const rect = modalContentRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 初始化尺寸
  modalWidth.value = rect.width;
  modalHeight.value = rect.height;
  
  // 设置初始位置为居中
  modalX.value = (viewportWidth - rect.width) / 2;
  modalY.value = (viewportHeight - rect.height) / 2;
  
  isPositioned.value = true;
};

// 开始拖动
const handleDragStart = (event: MouseEvent) => {
  if (!props.draggable || !modalContentRef.value) return;
  
  // 检查是否点击在头部区域（允许拖动的区域）
  const target = event.target as HTMLElement;
  const isHeader = target.closest('.knowledge-card-modal-header');
  const isResizeHandle = target.closest('.resize-handle');
  
  // 如果点击的是调整尺寸手柄，不触发拖动
  if (!isHeader || isResizeHandle) return;
  
  isDragging.value = true;
  dragStartX.value = event.clientX - modalX.value;
  dragStartY.value = event.clientY - modalY.value;
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
  
  // 阻止文本选择
  event.preventDefault();
};

// 拖动中
const handleDragMove = (event: MouseEvent) => {
  if (!isDragging.value || !modalContentRef.value) return;
  
  const rect = modalContentRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 计算新位置
  let newX = event.clientX - dragStartX.value;
  let newY = event.clientY - dragStartY.value;
  
  // 限制在视口内
  newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
  newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
  
  modalX.value = newX;
  modalY.value = newY;
};

// 结束拖动
const handleDragEnd = () => {
  isDragging.value = false;
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
};

// 开始调整尺寸
const handleResizeStart = (event: MouseEvent) => {
  if (!props.draggable || !modalContentRef.value) return;
  
  isResizing.value = true;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
  
  // 阻止默认行为
  event.preventDefault();
};

// 调整尺寸中
const handleResizeMove = (event: MouseEvent) => {
  if (!isResizing.value || !modalContentRef.value) return;
  
  const deltaX = event.clientX - resizeStartX.value;
  const deltaY = event.clientY - resizeStartY.value;
  
  // 计算新尺寸
  let newWidth = modalWidth.value + deltaX;
  let newHeight = modalHeight.value + deltaY;
  
  // 限制最小和最大尺寸
  newWidth = Math.max(minWidth.value, Math.min(newWidth, maxWidth.value));
  newHeight = Math.max(minHeight.value, Math.min(newHeight, maxHeight.value));
  
  // 检查是否会超出视口
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxAllowedWidth = viewportWidth - modalX.value - 20;
  const maxAllowedHeight = viewportHeight - modalY.value - 20;
  
  newWidth = Math.min(newWidth, maxAllowedWidth);
  newHeight = Math.min(newHeight, maxAllowedHeight);
  
  // 更新尺寸和起始位置
  modalWidth.value = newWidth;
  modalHeight.value = newHeight;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
};

// 结束调整尺寸
const handleResizeEnd = () => {
  isResizing.value = false;
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
};

// 计算弹窗样式
const modalStyle = computed(() => {
  if (!isPositioned.value) {
    return {};
  }
  
  const style: Record<string, string> = {
    position: 'fixed',
    left: `${modalX.value}px`,
    top: `${modalY.value}px`,
    transform: 'none',
    margin: '0'
  };
  
  // 应用动态尺寸
  if (modalWidth.value > 0) {
    style.width = `${modalWidth.value}px`;
  }
  if (modalHeight.value > 0) {
    style.height = `${modalHeight.value}px`;
  }
  
  // 添加 CSS 变量用于动态样式
  if (scaleRatio.value) {
    style['--scale-ratio'] = scaleRatio.value.toString();
  }
  
  return style;
});

// 组件挂载时初始化
onMounted(() => {
  if (props.isVisible) {
    initPosition();
    document.addEventListener('keydown', handleKeyDown);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
});
</script>

<style scoped>
/* 遮罩层样式 */
.knowledge-card-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(31, 58, 82, 0.5);
  z-index: 1001; /* 确保在其他弹窗之上 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 弹窗内容样式 */
.knowledge-card-modal-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

/* 可拖动状态 */
.knowledge-card-modal-content.is-draggable .knowledge-card-modal-header {
  cursor: move;
}

.knowledge-card-modal-content.is-dragging {
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
  cursor: grabbing !important;
  user-select: none;
  transition: box-shadow 0.2s ease;
}

.knowledge-card-modal-content.is-dragging * {
  cursor: grabbing !important;
  user-select: none;
}

/* 调整尺寸手柄 */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  cursor: nwse-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  background: linear-gradient(135deg, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.05) 50%);
  border-radius: 0 0 16px 0;
  transition: all 0.2s;
  z-index: 100;
  pointer-events: auto;
}

.resize-handle:hover {
  color: #667eea;
  background: linear-gradient(135deg, transparent 0%, transparent 50%, rgba(102, 126, 234, 0.15) 50%);
}

.resize-handle svg {
  transform: rotate(-45deg);
}

/* 调整尺寸中状态 */
.knowledge-card-modal-content.is-resizing {
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
  user-select: none;
  transition: none;
}

.knowledge-card-modal-content.is-resizing * {
  cursor: nwse-resize !important;
  user-select: none;
}

/* 头部样式 */
.knowledge-card-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #1b2a31 0%, #243841 100%);
  color: white;
  position: relative;
  transition: all 0.3s ease;
}

/* 卡片导航 */
.cards-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-index {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
}

.nav-buttons {
  display: flex;
  gap: 8px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  backdrop-filter: blur(4px);
}

.nav-btn svg {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

/* 调整样式：分开处理hover和active状态，避免复杂选择器 */
.nav-btn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.nav-btn:not(:disabled):active {
  transform: scale(0.95);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 卡片时间范围 */
.card-time-range {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
}

/* 关闭按钮 */
.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.close-button svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.close-button:hover {
  background: #efd8ce;
  transform: rotate(90deg) scale(1.15);
  box-shadow: 0 4px 16px rgba(239, 216, 206, 0.3);
}

/* 主体内容样式 */
.knowledge-card-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(102, 126, 234, 0.3) transparent;
}

.knowledge-card-modal-body::-webkit-scrollbar {
  width: 6px;
}

.knowledge-card-modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.knowledge-card-modal-body::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.knowledge-card-modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 卡片标题 */
.card-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.card-title {
  margin: 0;
  color: #333;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  flex: 1;
  word-break: break-word;
}

/* AI生成标记 */
.ai-badge {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  animation: glow 2s ease-in-out infinite alternate;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 卡片内容 */
.card-content {
  color: #495057;
  line-height: 1.8;
  font-size: 15px;
  margin-bottom: 24px;
  min-height: 100px;
}

.card-content p {
  margin-bottom: 16px;
  word-break: break-word;
}

.card-content a {
  color: #667eea;
  text-decoration: none;
  border-bottom: 2px solid rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  padding: 0 2px;
}

.card-content a:hover {
  color: #764ba2;
  border-bottom-color: #764ba2;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 3px;
}

.card-content a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #764ba2;
  transition: width 0.3s ease;
}

.card-content a:hover::after {
  width: 100%;
}

/* 图片样式 */
.card-content .card-image {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 16px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.card-content .card-image:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}

/* 代码块样式 */
.card-content pre {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 16px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 16px 0;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.08);
}

.card-content code {
  background: rgba(102, 126, 234, 0.1);
  padding: 3px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.9em;
  color: #667eea;
}

/* 引用样式 */
.card-content blockquote {
  margin: 16px 0;
  padding: 12px 20px;
  border-left: 4px solid #667eea;
  background: linear-gradient(135deg, #f0f4ff 0%, #e6e9ff 100%);
  color: #555;
  font-style: italic;
  border-radius: 0 8px 8px 0;
}

/* 列表样式 */
.card-content ul, 
.card-content ol {
  padding-left: 28px;
  margin: 16px 0;
}

.card-content li {
  margin-bottom: 8px;
  line-height: 1.6;
}

/* 标题样式 */
.card-content h1, 
.card-content h2, 
.card-content h3 {
  margin: 20px 0 12px 0;
  color: #333;
  font-weight: 700;
}

.card-content h1 {
  font-size: 24px;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
}

.card-content h2 {
  font-size: 20px;
}

.card-content h3 {
  font-size: 18px;
}

/* 文本样式 */
.card-content strong {
  color: #333;
  font-weight: 600;
}

.card-content em {
  font-style: italic;
  color: #666;
}

/* 操作按钮区域 */
.card-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.details-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.details-btn:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(102, 126, 234, 0.45);
}

.details-btn:active {
  transform: translateY(0);
}

.close-btn {
  background: linear-gradient(135deg, #1b2a31 0%, #243841 100%);
  color: white;
  border: 1px solid rgba(36, 56, 65, 0.3);
}

.close-btn:hover {
  background: linear-gradient(135deg, #243841 0%, #3a5260 100%);
  color: white;
  border-color: rgba(58, 82, 96, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(27, 42, 49, 0.3);
}

.close-btn:active {
  transform: translateY(0);
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(102, 126, 234, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
  }
}

.pulse {
  animation: pulse 2s infinite;
}

/* 发光动画 */
@keyframes glow {
  from {
    box-shadow: 0 0 8px rgba(79, 172, 254, 0.4);
  }
  to {
    box-shadow: 0 0 16px rgba(79, 172, 254, 0.7), 0 0 28px rgba(0, 242, 254, 0.3);
  }
}

/* 过渡动画 */
.modal-fade-enter-active, 
.modal-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from, 
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .knowledge-card-modal-content, 
.modal-fade-leave-to .knowledge-card-modal-content {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

.content-fade-enter-active, 
.content-fade-leave-active {
  transition: opacity 0.3s ease;
}

.content-fade-enter-from, 
.content-fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .knowledge-card-modal-content {
    width: 95%;
    max-height: 85vh;
    margin: 10px;
  }
  
  .knowledge-card-modal-header {
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
  }
  
  .knowledge-card-modal-body {
    padding: 16px;
  }
  
  .card-title {
    font-size: 20px;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .knowledge-card-modal-content {
    border-radius: 12px;
  }
  
  .knowledge-card-modal-header {
    padding: 12px;
  }
  
  .knowledge-card-modal-body {
    padding: 12px;
  }
  
  .card-title {
    font-size: 18px;
  }
  
  .card-content {
    font-size: 14px;
    line-height: 1.7;
  }
}
</style>