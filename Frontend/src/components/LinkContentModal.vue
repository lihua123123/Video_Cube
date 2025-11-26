<template>
  <div v-if="visible" class="link-modal-overlay" @click.self="handleClose">
    <div 
      ref="modalRef"
      class="link-modal-container" 
      :class="{ 'is-loading': isLoading, 'is-dragging': isDragging, 'is-resizing': isResizing }"
      :style="modalStyle"
      @click.stop
    >
      <!-- 头部导航 -->
      <div class="link-modal-header" @mousedown.stop="handleDragStart">
        <div class="header-left">
          <button class="back-btn" @click.stop="handleBack" title="返回知识卡片">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div class="drag-handle" title="拖动移动窗口">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3h2v2H9V3zm4 0h2v2h-2V3zM9 7h2v2H9V7zm4 0h2v2h-2V7zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"/>
            </svg>
          </div>
          <div class="link-modal-title">{{ title || '链接内容' }}</div>
        </div>
        <button class="link-modal-close" @click.stop="handleClose" title="关闭">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载内容...</div>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-message">{{ error }}</div>
        <button class="retry-button" @click="loadLinkContent">重试</button>
      </div>
      
      <!-- 内容区域 -->
      <div v-else class="link-modal-content">
        <!-- 内容头部 -->
        <div class="content-header">
          <div class="link-info">
            <div class="link-url-label">链接地址:</div>
            <div class="link-url">{{ safeUrl || '内部链接' }}</div>
          </div>
          <div class="content-actions">
            <button 
              class="external-link-btn" 
              @click="openExternal" 
              title="在新窗口打开"
              :disabled="!safeUrl"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
              在新窗口打开
            </button>
          </div>
        </div>
        
        <!-- 主体内容 -->
        <div class="content-body" v-html="content"></div>
        
        <!-- 提示信息 -->
        <div class="content-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>如果页面加载失败或显示不完整,请点击"在新窗口打开"按钮查看完整内容</span>
        </div>
        
        <!-- 相关知识卡片推荐 -->
        <div v-if="relatedCards && relatedCards.length > 0" class="related-cards">
          <h3 class="related-title">相关知识卡片</h3>
          <div class="related-cards-list">
            <div 
              v-for="card in relatedCards" 
              :key="card.id"
              class="related-card-item"
              @click="handleRelatedCardClick(card)"
            >
              <div class="card-item-title">{{ card.title }}</div>
              <div class="card-item-time">{{ formatTimeRange(card.startTime, card.endTime) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部操作区 -->
      <div class="link-modal-footer">
        <button class="primary-button" @click="handleClose">关闭</button>
      </div>
      
      <!-- 调整尺寸手柄 -->
      <div 
        class="resize-handle"
        @mousedown.stop.prevent="handleResizeStart"
        @click.stop
        title="拖动调整大小"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 22H20V20H22V22M22 18H20V16H22V18M18 22H16V20H18V22M18 18H16V16H18V18M14 22H12V20H14V22M22 14H20V12H22V14Z"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

// 定义属性
interface RelatedCard {
  id: number;
  title: string;
  startTime: number;
  endTime: number;
}

const props = defineProps<{
  visible: boolean;
  url?: string;
  title?: string;
  content?: string;
  relatedCards?: RelatedCard[];
}>();

// 定义事件
const emit = defineEmits<{
  close: [];
  back: [];
  externalOpen: [url: string];
  relatedCardClick: [card: RelatedCard];
}>();

// 内部状态
const isLoading = ref(false);
const error = ref('');
const loadedContent = ref('');

// 拖动和缩放相关状态
const modalRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const modalX = ref(0);
const modalY = ref(0);
const isPositioned = ref(false);

const isResizing = ref(false);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const modalWidth = ref(900);
const modalHeight = ref(0);
const minWidth = ref(500);
const minHeight = ref(400);
const maxWidth = ref(1400);
const maxHeight = ref(900);

// 计算属性
const safeUrl = computed(() => {
  // 安全检查URL，避免XSS
  if (!props.url) return '';
  
  try {
    const urlObj = new URL(props.url);
    // 可以添加安全域名白名单检查
    return urlObj.toString();
  } catch {
    return '';
  }
});

const content = computed(() => {
  // 优先使用父组件提供的内容
  if (props.content) {
    return sanitizeHtml(props.content);
  }
  return loadedContent.value;
});

// 监听URL变化，自动加载内容
watch(() => [props.url, props.visible], ([newUrl, isVisible]) => {
  if (newUrl && isVisible && !props.content) {
    loadLinkContent();
  }
}, { immediate: true });

// 加载链接内容
const loadLinkContent = async () => {
  if (!props.url || props.content) return;
  
  isLoading.value = true;
  error.value = '';
  
  try {
    // 这里可以根据需求实现内容加载逻辑
    // 1. 对于内部链接，可以从API获取详情
    // 2. 对于外部链接，可以进行预览或摘要提取
    
    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 这里是示例内容，实际应用中应根据API响应设置
    loadedContent.value = generateSampleContent(props.url);
  } catch (err) {
    error.value = '内容加载失败，请稍后重试';
    console.error('Failed to load link content:', err);
  } finally {
    isLoading.value = false;
  }
};

// 生成示例内容 - 使用iframe嵌入外部链接
const generateSampleContent = (url: string): string => {
  // 使用iframe嵌入外部链接,实现在模态框内直接显示
  return `
    <div class="iframe-container">
      <div class="iframe-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载页面内容...</div>
      </div>
      <iframe 
        src="${url}" 
        frameborder="0" 
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
        loading="lazy"
        title="链接内容"
        onload="this.previousElementSibling.style.display='none'"
        onerror="this.previousElementSibling.innerHTML='<div class=&quot;error-icon&quot;>⚠️</div><div class=&quot;error-text&quot;>页面加载失败，请点击上方按钮在新窗口打开</div>'"
      ></iframe>
    </div>
  `;
};

// HTML内容安全过滤
const sanitizeHtml = (html: string): string => {
  // 这里应该实现更完善的HTML内容安全过滤
  // 实际应用中可以使用如DOMPurify等库进行安全过滤
  
  // 简单的过滤示例
  const div = document.createElement('div');
  div.textContent = html;
  let cleanHtml = div.innerHTML;
  
  // 允许的标签和属性白名单（简化版）
  const allowedTags = ['h1', 'h2', 'h3', 'p', 'span', 'strong', 'em', 'br', 'ul', 'ol', 'li', 'blockquote', 'img', 'a'];
  const allowedAttrs = ['src', 'alt', 'href', 'target', 'rel'];
  
  // 实际应用中应使用专门的HTML清理库
  // 这里仅作为演示，返回处理后的内容
  return cleanHtml;
};

// 格式化时间范围
const formatTimeRange = (start: number, end: number): string => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
};

// 打开外部链接
const openExternal = () => {
  if (safeUrl.value) {
    emit('externalOpen', safeUrl.value);
  }
};

// 处理相关卡片点击
const handleRelatedCardClick = (card: RelatedCard) => {
  emit('relatedCardClick', card);
  handleClose();
};

// 初始化位置
const initPosition = () => {
  if (!modalRef.value || isPositioned.value) return;
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 初始化尺寸
  modalWidth.value = Math.min(900, viewportWidth - 40);
  modalHeight.value = Math.min(600, viewportHeight - 40);
  
  // 居中显示
  modalX.value = (viewportWidth - modalWidth.value) / 2;
  modalY.value = (viewportHeight - modalHeight.value) / 2;
  
  isPositioned.value = true;
};

// 开始拖动
const handleDragStart = (event: MouseEvent) => {
  if (!modalRef.value) return;
  
  // 检查是否点击在头部区域
  const target = event.target as HTMLElement;
  const isHeader = target.closest('.link-modal-header');
  const isCloseBtn = target.closest('.link-modal-close');
  const isResizeHandle = target.closest('.resize-handle');
  
  // 如果点击的是关闭按钮或调整尺寸手柄，不触发拖动
  if (!isHeader || isCloseBtn || isResizeHandle) return;
  
  isDragging.value = true;
  dragStartX.value = event.clientX - modalX.value;
  dragStartY.value = event.clientY - modalY.value;
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
  
  // 阻止文本选择和事件冒泡
  event.preventDefault();
  event.stopPropagation();
};

// 拖动中
const handleDragMove = (event: MouseEvent) => {
  if (!isDragging.value || !modalRef.value) return;
  
  const rect = modalRef.value.getBoundingClientRect();
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
  if (!modalRef.value) return;
  
  isResizing.value = true;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
  
  // 阻止默认行为
  event.preventDefault();
  event.stopPropagation();
};

// 调整尺寸中
const handleResizeMove = (event: MouseEvent) => {
  if (!isResizing.value || !modalRef.value) return;
  
  // 阻止事件传播,避免意外触发其他事件
  event.preventDefault();
  event.stopPropagation();
  
  // 计算从上次位置到当前位置的增量
  const deltaX = event.clientX - resizeStartX.value;
  const deltaY = event.clientY - resizeStartY.value;
  
  // 基于当前尺寸加上增量计算新尺寸
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

// 计算模态框样式
const modalStyle = computed(() => {
  if (!isPositioned.value) {
    return {};
  }
  
  const style: Record<string, string> = {
    position: 'fixed',
    left: `${modalX.value}px`,
    top: `${modalY.value}px`,
    width: `${modalWidth.value}px`,
    height: `${modalHeight.value}px`,
    transform: 'none',
    margin: '0'
  };
  
  return style;
});

// 关闭弹窗
const handleClose = () => {
  // 重置状态
  isLoading.value = false;
  error.value = '';
  loadedContent.value = '';
  isPositioned.value = false;
  emit('close');
};

// 返回到知识卡片
const handleBack = () => {
  // 重置状态
  isLoading.value = false;
  error.value = '';
  loadedContent.value = '';
  isPositioned.value = false;
  emit('back');
};

// 监听可见性变化，初始化位置
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    await nextTick();
    setTimeout(() => {
      initPosition();
    }, 50);
  }
});

// 组件挂载时初始化
onMounted(async () => {
  if (props.visible) {
    await nextTick();
    setTimeout(() => {
      initPosition();
    }, 50);
  }
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
});
</script>

<style scoped>
/* 遮罩层 */
.link-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
  pointer-events: none; /* 关键:让overlay不捕获鼠标事件,避免缩放时意外关闭 */
}

/* 弹窗容器 */
.link-modal-container {
  background: white;
  border-radius: 12px;
  width: 900px;
  height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
  pointer-events: auto; /* 让模态框本身可以接收鼠标事件 */
}

/* 头部 */
.link-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: move;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.link-modal-title {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-modal-close {
  background: none;
  border: none;
  color: white;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.link-modal-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 返回按钮 */
.back-btn {
  background: none;
  border: none;
  color: white;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateX(-2px);
}

.back-btn:active {
  transform: translateX(-4px);
}

/* 内容区域 */
.link-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* 内容头部 */
.content-header {
  padding: 12px 24px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
}

.link-info {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-url-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.link-url {
  font-size: 12px;
  color: #667eea;
  word-break: break-all;
  font-family: 'Courier New', Courier, monospace;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.content-actions {
  display: flex;
  gap: 8px;
}

/* 拖动状态 */
.is-dragging {
  cursor: grabbing !important;
  user-select: none;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.is-dragging * {
  cursor: grabbing !important;
  user-select: none;
}

/* 缩放状态 */
.is-resizing {
  cursor: nwse-resize !important;
  user-select: none;
  border: 2px solid #667eea;
}

.is-resizing * {
  cursor: nwse-resize !important;
  user-select: none;
}

/* 拖动手柄 */
.drag-handle {
  opacity: 0.6;
  transition: opacity 0.3s;
  cursor: move;
  flex-shrink: 0;
}

.link-modal-header:hover .drag-handle {
  opacity: 1;
}

/* 缩放手柄 */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 2px;
  opacity: 0.3;
  transition: opacity 0.3s;
}

.resize-handle:hover {
  opacity: 0.8;
}

.resize-handle svg {
  width: 16px;
  height: 16px;
  color: #666;
}

.external-link-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #667eea;
  border-radius: 6px;
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.external-link-btn:hover:not(:disabled) {
  background-color: #667eea;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.external-link-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 主体内容 */
.content-body {
  flex: 1;
  padding: 0;
  overflow: hidden;
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  display: flex;
  flex-direction: column;
}

/* iframe容器 */
:deep(.iframe-container) {
  width: 100%;
  height: 100%;
  min-height: 500px;
  position: relative;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

:deep(.iframe-loading) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  z-index: 1;
  gap: 16px;
}

:deep(.iframe-loading .loading-spinner) {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

:deep(.iframe-loading .loading-text) {
  color: #667eea;
  font-size: 14px;
}

:deep(.iframe-loading .error-icon) {
  font-size: 48px;
  margin-bottom: 16px;
}

:deep(.iframe-loading .error-text) {
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
  max-width: 300px;
}

:deep(.iframe-container iframe) {
  width: 100%;
  height: 100%;
  flex: 1;
  border: none;
  background: white;
}

.content-body h1,
.content-body h2,
.content-body h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  color: #222;
  font-weight: 600;
}

.content-body h1 { font-size: 24px; }
.content-body h2 { font-size: 20px; }
.content-body h3 { font-size: 18px; }

.content-body p {
  margin-bottom: 16px;
}

.content-body ul,
.content-body ol {
  margin-bottom: 16px;
  padding-left: 24px;
}

.content-body li {
  margin-bottom: 8px;
}

.content-body blockquote {
  margin: 16px 0;
  padding: 12px 16px;
  border-left: 4px solid #667eea;
  background-color: #f8f9ff;
  color: #555;
  font-style: italic;
}

.content-body img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
}

.content-body a {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px dotted #667eea;
}

.content-body a:hover {
  border-bottom-style: solid;
}

/* 相关知识卡片 */
.related-cards {
  padding: 24px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.related-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.related-cards-list {
  display: grid;
  gap: 12px;
}

.related-card-item {
  padding: 12px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.related-card-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.card-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.card-item-time {
  font-size: 12px;
  color: #667eea;
  font-family: 'Courier New', Courier, monospace;
}

/* 加载状态 */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #667eea;
  font-size: 14px;
}

/* 错误状态 */
.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 16px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
}

.error-message {
  color: #e74c3c;
  font-size: 16px;
  max-width: 400px;
}

.retry-button {
  padding: 8px 16px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #764ba2;
}

/* 提示信息 */
.content-hint {
  padding: 12px 24px;
  background: #fff9e6;
  border-top: 1px solid #ffe7a0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #856404;
  flex-shrink: 0;
}

.content-hint svg {
  flex-shrink: 0;
  color: #ffc107;
}

/* 底部 */
.link-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #fafafa;
  flex-shrink: 0;
}

.primary-button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 文档内容样式 */
:deep(.document-content) {
  h2 {
    color: #667eea;
    border-bottom: 2px solid #667eea;
    padding-bottom: 8px;
  }
}

/* 术语定义样式 */
:deep(.term-definition) {
  .definition {
    font-size: 16px;
    line-height: 1.8;
    margin-bottom: 24px;
    padding: 16px;
    background-color: #f8f9ff;
    border-radius: 8px;
    border-left: 4px solid #667eea;
  }
  
  .related-info {
    margin-top: 24px;
  }
  
  .related-info h3 {
    color: #667eea;
    margin-bottom: 12px;
  }
}

/* 链接预览样式 */
:deep(.link-preview) {
  .preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    margin-top: 24px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 2px dashed #dee2e6;
    text-align: center;
  }
  
  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .placeholder-text {
    color: #6c757d;
    font-size: 14px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .link-modal-container {
    width: 95%;
    max-height: 90vh;
  }
  
  .link-modal-header,
  .content-header,
  .content-body,
  .related-cards,
  .link-modal-footer {
    padding: 12px 16px;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .link-info {
    width: 100%;
  }
  
  .related-card-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .card-item-time {
    align-self: flex-end;
  }
}
</style>