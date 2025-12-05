<template>
  <transition name="popup-fade">
    <div v-if="visible" class="knowledge-card-popup-overlay" @click.self="handleClose">
      <div 
        ref="popupRef"
        class="knowledge-card-popup" 
        :class="[positionClass, sizeClass, { 'is-dragging': isDragging, 'is-draggable': draggable, 'is-resizing': isResizing }]"
        :style="popupStyle"
      >
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="handleClose" title="关闭">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        
        <!-- 卡片头部 -->
        <div class="popup-header" :class="{ 'draggable-header': draggable }" @mousedown="handleDragStart">
          <div v-if="draggable" class="drag-handle" title="拖动移动弹窗">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3h2v2H9V3zm4 0h2v2h-2V3zM9 7h2v2H9V7zm4 0h2v2h-2V7zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"/>
            </svg>
          </div>
          <div class="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div class="header-content">
            <h3 class="popup-title">{{ card?.title }}</h3>
            <div class="popup-meta">
              <span class="time-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                  <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                {{ formatTimeRange(card?.startTime, card?.endTime) }}
              </span>
              <span v-if="card?.is_ai_generated" class="ai-badge">AI生成</span>
              <span class="type-badge">{{ getContentTypeLabel(card?.content_type) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 卡片内容 -->
        <div class="popup-body">
          <div class="content-wrapper" v-html="formatContent(card?.content)" @click="handleContentClick"></div>
        </div>
        
        <!-- 卡片底部操作 -->
        <div class="popup-footer">
          <button class="action-btn primary-btn" @click="handleClose">
            关闭
          </button>
        </div>
        
        <!-- 调整尺寸手柄 -->
        <div 
          v-if="draggable" 
          class="resize-handle"
          @mousedown="handleResizeStart"
          title="拖动调整大小"
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
import { ref, computed, watch, onUnmounted, onMounted } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true // 启用 GitHub Flavored Markdown
});

// 定义卡片接口
interface KnowledgeCard {
  id: number;
  video_id: number;
  startTime: number;
  endTime: number;
  title: string;
  content: string;
  content_type: string;
  display_style: string;
  is_ai_generated?: boolean;
}

// 定义属性
const props = withDefaults(defineProps<{
  card: KnowledgeCard | null;
  visible: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  size?: 'small' | 'medium' | 'large';
  autoClose?: boolean;
  autoCloseDelay?: number; // 秒
  draggable?: boolean; // 是否可拖动
}>(), {
  position: 'top-right',
  size: 'medium',
  autoClose: false,
  autoCloseDelay: 10,
  draggable: true
});

// 定义事件
const emit = defineEmits<{
  close: [];
  cardLinkClick: [url: string];
}>();

// 内部状态
const progressPercent = ref(0);
let autoCloseTimer: number | null = null;
let progressInterval: number | null = null;

// 拖动相关状态
const popupRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const popupX = ref(0);
const popupY = ref(0);
const isPositioned = ref(false);

// 尺寸调整相关状态
const isResizing = ref(false);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const popupWidth = ref(0);
const popupHeight = ref(0);
const minWidth = ref(280);
const minHeight = ref(300);
const maxWidth = ref(800);
const maxHeight = ref(900);

// 计算缩放比例
const scaleRatio = computed(() => {
  if (popupWidth.value === 0) return 1;
  const baseWidth = 420; // medium 尺寸作为基准
  const ratio = popupWidth.value / baseWidth;
  // 限制缩放比例在 0.7 到 1.8 之间，避免过小或过大
  return Math.max(0.7, Math.min(1.8, ratio));
});

// 计算属性
const positionClass = computed(() => `position-${props.position}`);
const sizeClass = computed(() => `size-${props.size}`);
const autoCloseEnabled = computed(() => props.autoClose && props.autoCloseDelay > 0);

// 监听可见性变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    if (autoCloseEnabled.value) {
      startAutoClose();
    }
  } else {
    stopAutoClose();
    // 关闭时重置位置标记，下次显示时重新计算初始位置
    isPositioned.value = false;
  }
});

// 初始化位置
onMounted(() => {
  if (props.visible && popupRef.value) {
    initPosition();
  }
});

// 监听弹窗引用和可见性，设置初始位置
watch([popupRef, () => props.visible], ([newRef, newVisible]) => {
  if (newRef && newVisible && !isPositioned.value) {
    initPosition();
  }
});

// 启动自动关闭
const startAutoClose = () => {
  stopAutoClose(); // 先清除之前的定时器
  progressPercent.value = 0;
  
  const totalTime = props.autoCloseDelay * 1000; // 转换为毫秒
  const intervalTime = 50; // 每50ms更新一次进度
  const incrementPercent = (intervalTime / totalTime) * 100;
  
  progressInterval = window.setInterval(() => {
    progressPercent.value += incrementPercent;
    if (progressPercent.value >= 100) {
      handleClose();
    }
  }, intervalTime);
  
  autoCloseTimer = window.setTimeout(() => {
    handleClose();
  }, totalTime);
};

// 停止自动关闭
const stopAutoClose = () => {
  if (autoCloseTimer !== null) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
  if (progressInterval !== null) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  progressPercent.value = 0;
};

// 格式化时间范围
const formatTimeRange = (start?: number, end?: number): string => {
  if (start === undefined || end === undefined) return '';
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
};

// 获取内容类型标签
const getContentTypeLabel = (type?: string): string => {
  if (!type) return '';
  const typeMap: Record<string, string> = {
    'rich_text': '富文本',
    'markdown': 'Markdown',
    'text': '文本'
  };
  return typeMap[type] || type;
};

// 格式化内容 - 使用 Markdown 渲染
const formatContent = (content?: string): string => {
  if (!content) return '';
  
  try {
    // 1. 使用 marked 解析 Markdown
    let html = marked.parse(content) as string;
    
    // 2. 修复图片 URL (marked 已经将 Markdown 图片转换为 HTML img 标签)
    html = html.replace(/<img([^>]*)src="([^"]+)"([^>]*)>/gi, (match, before, url, after) => {
      console.log('🖼️ 原始图片URL:', url);
      
      let imageUrl = url;
      
      // 🔧 修复旧的 localhost:5173 URL
      if (url.includes('localhost:5173/uploads/')) {
        imageUrl = url.replace('http://localhost:5173/uploads/', 'http://localhost:3000/uploads/');
        console.log('⚠️ 修正旧URL:', url, '→', imageUrl);
      }
      // 处理完整URL
      else if (url.startsWith('http://') || url.startsWith('https://')) {
        imageUrl = url;
      }
      // 处理 /uploads/ 开头的相对路径
      else if (url.startsWith('/uploads/')) {
        imageUrl = 'http://localhost:3000' + url;
        console.log('🔄 转换相对路径:', url, '→', imageUrl);
      }
      // 处理没有 / 开头的相对路径
      else if (!url.startsWith('/')) {
        imageUrl = 'http://localhost:3000/' + url;
        console.log('🔄 添加前缀:', url, '→', imageUrl);
      }
      
      console.log('✅ 最终图片URL:', imageUrl);
      
      // 添加必要的类名和属性
      return `<img${before}src="${imageUrl}"${after} class="content-image popup-image" loading="lazy">`;
    });
    
    // 3. 为链接添加类名和目标属性
    html = html.replace(/<a(?![^>]*class=)/g, '<a class="card-link"');
    html = html.replace(/<a(?![^>]*target=)/g, '<a target="_blank" rel="noopener noreferrer"');
    
    // 4. 自动识别纯文本 URL 链接 - 使用安全的保护-替换-恢复策略
    const protectedTags: { [key: string]: string } = {};
    let tagCounter = 0;
    
    // 保护 img 和 a 标签
    html = html.replace(/<(img|a)[^>]*>/gi, (match) => {
      const key = `__PROTECTED_TAG_${tagCounter++}__`;
      protectedTags[key] = match;
      return key;
    });
    
    // 现在安全地转换URL为链接
    html = html.replace(/(https?:\/\/[^\s<>"]+)/gi, '<a href="$1" class="card-link" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // 恢复被保护的标签
    Object.keys(protectedTags).forEach(key => {
      const tag = protectedTags[key];
      if (tag) {
        html = html.replace(key, tag);
      }
    });
    
    // 5. 使用 DOMPurify 清理 HTML (防止 XSS 攻击)
    html = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'del', 's', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'hr', 'mark', 'table', 'thead', 
                     'tbody', 'tr', 'th', 'td', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'loading']
    });
    
    return html;
  } catch (error) {
    console.error('❌ Markdown 渲染失败:', error);
    // 如果解析失败,返回纯文本(转义HTML)
    return escapeHtml(content);
  }
};

// HTML转义辅助函数
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// 处理关闭
const handleClose = () => {
  stopAutoClose();
  emit('close');
};

// 处理内容区域点击 - 拦截链接点击
const handleContentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  
  // 检查是否点击了链接
  if (target.tagName === 'A' && target.classList.contains('card-link')) {
    event.preventDefault(); // 阻止默认跳转行为
    
    const url = target.getAttribute('href');
    if (url) {
      console.log('Popup link clicked:', url);
      emit('cardLinkClick', url);
    }
  }
};

// 初始化弹窗位置和尺寸
const initPosition = () => {
  if (!popupRef.value || isPositioned.value) return;
  
  const rect = popupRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 初始化尺寸
  popupWidth.value = rect.width;
  popupHeight.value = rect.height;
  
  // 根据position属性设置初始位置
  switch (props.position) {
    case 'top-right':
      popupX.value = viewportWidth - rect.width - 20;
      popupY.value = 20;
      break;
    case 'top-left':
      popupX.value = 20;
      popupY.value = 20;
      break;
    case 'bottom-right':
      popupX.value = viewportWidth - rect.width - 20;
      popupY.value = viewportHeight - rect.height - 20;
      break;
    case 'bottom-left':
      popupX.value = 20;
      popupY.value = viewportHeight - rect.height - 20;
      break;
    case 'center':
      popupX.value = (viewportWidth - rect.width) / 2;
      popupY.value = (viewportHeight - rect.height) / 2;
      break;
  }
  
  isPositioned.value = true;
};

// 开始拖动
const handleDragStart = (event: MouseEvent) => {
  if (!props.draggable || !popupRef.value) return;
  
  // 检查是否点击在头部区域（允许拖动的区域）
  const target = event.target as HTMLElement;
  const isHeader = target.closest('.popup-header');
  const isResizeHandle = target.closest('.resize-handle');
  
  // 如果点击的是调整尺寸手柄，不触发拖动
  if (!isHeader || isResizeHandle) return;
  
  isDragging.value = true;
  dragStartX.value = event.clientX - popupX.value;
  dragStartY.value = event.clientY - popupY.value;
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
  
  // 阻止文本选择
  event.preventDefault();
  
  // 暂停自动关闭
  if (autoCloseTimer !== null) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
  if (progressInterval !== null) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
};

// 拖动中
const handleDragMove = (event: MouseEvent) => {
  if (!isDragging.value || !popupRef.value) return;
  
  const rect = popupRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 计算新位置
  let newX = event.clientX - dragStartX.value;
  let newY = event.clientY - dragStartY.value;
  
  // 限制在视口内
  newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
  newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
  
  popupX.value = newX;
  popupY.value = newY;
};

// 结束拖动
const handleDragEnd = () => {
  isDragging.value = false;
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
  
  // 恢复自动关闭（如果启用）
  if (autoCloseEnabled.value && props.visible) {
    startAutoClose();
  }
};

// 开始调整尺寸
const handleResizeStart = (event: MouseEvent) => {
  if (!popupRef.value) return;
  
  isResizing.value = true;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
  
  // 阻止默认行为
  event.preventDefault();
  event.stopPropagation();
  
  // 暂停自动关闭
  if (autoCloseTimer !== null) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
  if (progressInterval !== null) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
};

// 调整尺寸中
const handleResizeMove = (event: MouseEvent) => {
  if (!isResizing.value || !popupRef.value) return;
  
  const deltaX = event.clientX - resizeStartX.value;
  const deltaY = event.clientY - resizeStartY.value;
  
  // 计算新尺寸（基于初始尺寸加上累积的变化量）
  const baseWidth = popupWidth.value;
  const baseHeight = popupHeight.value;
  
  let newWidth = baseWidth + deltaX;
  let newHeight = baseHeight + deltaY;
  
  // 限制最小和最大尺寸
  newWidth = Math.max(minWidth.value, Math.min(newWidth, maxWidth.value));
  newHeight = Math.max(minHeight.value, Math.min(newHeight, maxHeight.value));
  
  // 检查是否会超出视口
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxAllowedWidth = viewportWidth - popupX.value - 20;
  const maxAllowedHeight = viewportHeight - popupY.value - 20;
  
  newWidth = Math.min(newWidth, maxAllowedWidth);
  newHeight = Math.min(newHeight, maxAllowedHeight);
  
  // 更新尺寸和起始位置
  popupWidth.value = newWidth;
  popupHeight.value = newHeight;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;
};

// 结束调整尺寸
const handleResizeEnd = () => {
  isResizing.value = false;
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
  
  // 恢复自动关闭（如果启用）
  if (autoCloseEnabled.value && props.visible) {
    startAutoClose();
  }
};

// 计算弹窗样式
const popupStyle = computed(() => {
  if (!isPositioned.value) {
    return {};
  }
  
  const style: Record<string, string> = {
    position: 'fixed',
    left: `${popupX.value}px`,
    top: `${popupY.value}px`,
    transform: 'none',
    margin: '0'
  };
  
  // 只有在已经初始化尺寸后才应用宽高
  if (popupWidth.value > 0) {
    style.width = `${popupWidth.value}px`;
  }
  if (popupHeight.value > 0) {
    style.height = `${popupHeight.value}px`;
  }
  
  // 添加 CSS 变量用于动态缩放
  if (scaleRatio.value) {
    style['--scale-ratio'] = scaleRatio.value.toString();
  }
  
  return style;
});

// 组件卸载时清理定时器和事件监听
onUnmounted(() => {
  stopAutoClose();
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
});
</script>

<style scoped>
/* 弹窗遮罩层 */
.knowledge-card-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 20px;
}

/* 弹窗主体 */
.knowledge-card-popup {
  position: relative;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
  transition: box-shadow 0.2s ease;
  --scale-ratio: 1; /* 默认缩放比例 */
}

/* 可拖动状态 */
.knowledge-card-popup.is-draggable {
  cursor: move;
}

/* 拖动中状态 */
.knowledge-card-popup.is-dragging {
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1);
  cursor: grabbing !important;
  user-select: none;
}

.knowledge-card-popup.is-dragging * {
  cursor: grabbing !important;
  user-select: none;
}

/* 调整尺寸手柄 */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
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
  background: linear-gradient(135deg, transparent 0%, transparent 50%, rgba(102, 126, 234, 0.1) 50%);
}

.resize-handle svg {
  transform: rotate(-45deg);
}

/* 调整尺寸中状态 */
.knowledge-card-popup.is-resizing {
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(102, 126, 234, 0.3);
  user-select: none;
  transition: none;
}

.knowledge-card-popup.is-resizing * {
  cursor: nwse-resize !important;
  user-select: none;
}

.knowledge-card-popup.is-resizing .resize-handle {
  color: #667eea;
  background: linear-gradient(135deg, transparent 0%, transparent 50%, rgba(102, 126, 234, 0.2) 50%);
}

/* 位置样式 */
.position-top-right {
  align-self: flex-start;
  margin-left: auto;
}

.position-top-left {
  align-self: flex-start;
  margin-right: auto;
}

.position-bottom-right {
  align-self: flex-end;
  margin-left: auto;
}

.position-bottom-left {
  align-self: flex-end;
  margin-right: auto;
}

.position-center {
  align-self: center;
  margin: auto;
}

/* 尺寸样式 - 仅作为初始尺寸，可被动态样式覆盖 */
.size-small {
  width: 320px;
}

.size-medium {
  width: 420px;
}

.size-large {
  width: 540px;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #666;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
  transform: scale(1.1);
}

/* 弹窗头部 */
.popup-header {
  display: flex;
  align-items: flex-start;
  gap: calc(12px * var(--scale-ratio, 1));
  padding: calc(24px * var(--scale-ratio, 1)) calc(24px * var(--scale-ratio, 1)) calc(16px * var(--scale-ratio, 1));
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

/* 可拖动头部 */
.popup-header.draggable-header {
  cursor: move;
}

.popup-header.draggable-header:active {
  cursor: grabbing;
}

/* 拖动手柄 */
.drag-handle {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.6;
  transition: opacity 0.2s;
  pointer-events: none;
}

.popup-header:hover .drag-handle {
  opacity: 1;
}

.header-icon {
  flex-shrink: 0;
  width: calc(40px * var(--scale-ratio, 1));
  height: calc(40px * var(--scale-ratio, 1));
  background: rgba(255, 255, 255, 0.2);
  border-radius: calc(12px * var(--scale-ratio, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: calc(24px * var(--scale-ratio, 1));
}

.header-icon svg {
  width: calc(24px * var(--scale-ratio, 1));
  height: calc(24px * var(--scale-ratio, 1));
}

.popup-header:not(.draggable-header) .header-icon {
  margin-left: 0;
}

.header-content {
  flex: 1;
  min-width: 0;
}

.popup-title {
  font-size: calc(18px * var(--scale-ratio, 1));
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.3;
  color: white;
}

.popup-meta {
  display: flex;
  flex-wrap: wrap;
  gap: calc(8px * var(--scale-ratio, 1));
  align-items: center;
  font-size: calc(12px * var(--scale-ratio, 1));
}

.time-badge,
.ai-badge,
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: calc(4px * var(--scale-ratio, 1));
  padding: calc(4px * var(--scale-ratio, 1)) calc(10px * var(--scale-ratio, 1));
  border-radius: calc(12px * var(--scale-ratio, 1));
  font-weight: 500;
}

.time-badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.time-badge svg {
  width: calc(14px * var(--scale-ratio, 1));
  height: calc(14px * var(--scale-ratio, 1));
}

.ai-badge {
  background: rgba(243, 104, 104, 0.9);
  color: white;
}

.type-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 弹窗主体 */
.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: calc(20px * var(--scale-ratio, 1)) calc(24px * var(--scale-ratio, 1));
  background: #fafafa;
  min-height: 0; /* 允许flex子元素正确收缩 */
}

.content-wrapper {
  font-size: calc(14px * var(--scale-ratio, 1));
  line-height: 1.8;
  color: #333;
  word-break: break-word;
  width: 100%;
  box-sizing: border-box;
}

.content-wrapper :deep(h1),
.content-wrapper :deep(h2),
.content-wrapper :deep(h3) {
  margin-top: calc(16px * var(--scale-ratio, 1));
  margin-bottom: calc(8px * var(--scale-ratio, 1));
  color: #222;
  font-weight: 600;
}

.content-wrapper :deep(h1) {
  font-size: calc(20px * var(--scale-ratio, 1));
}

.content-wrapper :deep(h2) {
  font-size: calc(18px * var(--scale-ratio, 1));
}

.content-wrapper :deep(h3) {
  font-size: calc(16px * var(--scale-ratio, 1));
}

.content-wrapper :deep(p) {
  margin: calc(8px * var(--scale-ratio, 1)) 0;
}

.content-wrapper :deep(a) {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px dotted #667eea;
  transition: all 0.2s;
}

.content-wrapper :deep(a:hover) {
  color: #764ba2;
  border-bottom-style: solid;
}

.content-wrapper :deep(strong) {
  font-weight: 600;
  color: #222;
}

.content-wrapper :deep(em) {
  font-style: italic;
}

.content-wrapper :deep(code) {
  background: rgba(102, 126, 234, 0.1);
  padding: calc(2px * var(--scale-ratio, 1)) calc(6px * var(--scale-ratio, 1));
  border-radius: calc(4px * var(--scale-ratio, 1));
  font-family: 'Courier New', monospace;
  font-size: calc(13px * var(--scale-ratio, 1));
}

.content-wrapper :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: calc(16px * var(--scale-ratio, 1));
  border-radius: calc(8px * var(--scale-ratio, 1));
  overflow-x: auto;
  margin: calc(12px * var(--scale-ratio, 1)) 0;
  max-width: 100%;
  box-sizing: border-box;
  font-size: calc(13px * var(--scale-ratio, 1));
}

.content-wrapper :deep(ul),
.content-wrapper :deep(ol) {
  margin: calc(8px * var(--scale-ratio, 1)) 0;
  padding-left: calc(24px * var(--scale-ratio, 1));
}

.content-wrapper :deep(li) {
  margin: calc(4px * var(--scale-ratio, 1)) 0;
}

.content-wrapper :deep(blockquote) {
  border-left: calc(4px * var(--scale-ratio, 1)) solid #667eea;
  padding-left: calc(16px * var(--scale-ratio, 1));
  margin: calc(12px * var(--scale-ratio, 1)) 0;
  color: #666;
  font-style: italic;
  max-width: 100%;
  box-sizing: border-box;
}

.content-wrapper :deep(img),
.content-wrapper :deep(.content-image),
.content-wrapper :deep(.popup-image) {
  max-width: 100%;
  width: auto;
  height: auto;
  display: block;
  margin: calc(12px * var(--scale-ratio, 1)) auto;
  border-radius: calc(8px * var(--scale-ratio, 1));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: zoom-in;
  transition: transform 0.2s, box-shadow 0.2s;
  object-fit: contain;
  /* 确保大图片能够缩小 */
  max-height: 400px;
}

/* 小尺寸弹窗的图片限制 */
.knowledge-card-popup.size-small .content-wrapper :deep(img),
.knowledge-card-popup.size-small .content-wrapper :deep(.content-image) {
  max-height: 200px;
}

/* 中尺寸弹窗的图片限制 */
.knowledge-card-popup.size-medium .content-wrapper :deep(img),
.knowledge-card-popup.size-medium .content-wrapper :deep(.content-image) {
  max-height: 300px;
}

/* 大尺寸弹窗的图片限制 */
.knowledge-card-popup.size-large .content-wrapper :deep(img),
.knowledge-card-popup.size-large .content-wrapper :deep(.content-image) {
  max-height: 500px;
}

.content-wrapper :deep(img:hover),
.content-wrapper :deep(.content-image:hover),
.content-wrapper :deep(.popup-image:hover) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 链接样式增强 */
.content-wrapper :deep(a.card-link) {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px solid #667eea;
  padding: calc(2px * var(--scale-ratio, 1));
  border-radius: calc(2px * var(--scale-ratio, 1));
  background-color: rgba(102, 126, 234, 0.05);
  transition: all 0.2s ease;
}

.content-wrapper :deep(a.card-link:hover) {
  color: #fff;
  background-color: #667eea;
  border-bottom-color: #667eea;
  transform: translateY(calc(-0.5px * var(--scale-ratio, 1)));
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

/* 表格样式 */
.content-wrapper :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: calc(12px * var(--scale-ratio, 1)) 0;
  border: 1px solid #e0e0e0;
  border-radius: calc(6px * var(--scale-ratio, 1));
  overflow: hidden;
}

.content-wrapper :deep(th),
.content-wrapper :deep(td) {
  border: 1px solid #e0e0e0;
  padding: calc(8px * var(--scale-ratio, 1)) calc(12px * var(--scale-ratio, 1));
  text-align: left;
  font-size: calc(13px * var(--scale-ratio, 1));
}

.content-wrapper :deep(th) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.content-wrapper :deep(tr:nth-child(even)) {
  background: #f8f9fa;
}

.content-wrapper :deep(tr:hover) {
  background: #f0f2ff;
}

/* 删除线样式 */
.content-wrapper :deep(del) {
  text-decoration: line-through;
  color: #999;
  opacity: 0.7;
}

/* 高亮标记样式 */
.content-wrapper :deep(mark) {
  background: linear-gradient(90deg, rgba(255, 235, 59, 0.3), rgba(255, 193, 7, 0.3));
  padding: calc(2px * var(--scale-ratio, 1)) calc(4px * var(--scale-ratio, 1));
  border-radius: calc(3px * var(--scale-ratio, 1));
  color: inherit;
}

/* 分隔线样式 */
.content-wrapper :deep(hr) {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: calc(20px * var(--scale-ratio, 1)) 0;
  background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
  height: 1px;
}

/* 引用块增强样式 */
.content-wrapper :deep(blockquote) {
  border-left: calc(4px * var(--scale-ratio, 1)) solid #667eea;
  padding: calc(12px * var(--scale-ratio, 1)) calc(16px * var(--scale-ratio, 1));
  margin: calc(12px * var(--scale-ratio, 1)) 0;
  color: #555;
  font-style: italic;
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.05), transparent);
  border-radius: calc(4px * var(--scale-ratio, 1));
  max-width: 100%;
  box-sizing: border-box;
}

/* 代码块增强样式 */
.content-wrapper :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: calc(16px * var(--scale-ratio, 1));
  border-radius: calc(8px * var(--scale-ratio, 1));
  overflow-x: auto;
  margin: calc(12px * var(--scale-ratio, 1)) 0;
  max-width: 100%;
  box-sizing: border-box;
  font-size: calc(13px * var(--scale-ratio, 1));
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-wrapper :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
  border-radius: 0;
}

/* 弹窗底部 */
.popup-footer {
  display: flex;
  gap: calc(12px * var(--scale-ratio, 1));
  padding: calc(16px * var(--scale-ratio, 1)) calc(24px * var(--scale-ratio, 1));
  background: white;
  border-top: 1px solid #e0e0e0;
}

.action-btn {
  flex: 1;
  padding: calc(10px * var(--scale-ratio, 1)) calc(20px * var(--scale-ratio, 1));
  border: none;
  border-radius: calc(8px * var(--scale-ratio, 1));
  font-size: calc(14px * var(--scale-ratio, 1));
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn {
  background: #f5f5f5;
  color: #666;
}

.secondary-btn:hover {
  background: #e8e8e8;
  color: #333;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 动画效果 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 过渡动画 */
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
  transform: translateY(-40px) scale(0.9);
  box-shadow: 0 0 0 rgba(0, 0, 0, 0.1);
}

/* 卡片位置变化过渡 */
.knowledge-card-popup {
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .knowledge-card-popup-overlay {
    padding: 12px;
  }
  
  .knowledge-card-popup {
    width: 100% !important;
    max-width: 100%;
    max-height: calc(100vh - 24px);
  }
  
  .popup-header {
    padding: 20px 20px 12px;
  }
  
  .popup-title {
    font-size: 16px;
  }
  
  .popup-body {
    padding: 16px 20px;
  }
  
  .popup-footer {
    padding: 12px 20px;
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}

/* 滚动条样式 */
.popup-body::-webkit-scrollbar {
  width: 6px;
}

.popup-body::-webkit-scrollbar-track {
  background: transparent;
}

.popup-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.popup-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 全屏模式样式 - 使用非scoped样式以确保能覆盖 */
/* ===== 全屏模式支持 ===== */
/* 当父容器(video-wrapper)处于全屏状态时,overlay必须使用absolute定位 */
/* 重要: 这个样式必须是非scoped的,才能在全屏模式下生效 */

.video-wrapper:fullscreen .knowledge-card-popup-overlay,
.video-wrapper:-webkit-full-screen .knowledge-card-popup-overlay,
.video-wrapper:-moz-full-screen .knowledge-card-popup-overlay,
.video-wrapper:-ms-fullscreen .knowledge-card-popup-overlay {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 10000 !important;
  display: flex !important;
  pointer-events: none !important;
}

.video-wrapper:fullscreen .knowledge-card-popup,
.video-wrapper:-webkit-full-screen .knowledge-card-popup,
.video-wrapper:-moz-full-screen .knowledge-card-popup,
.video-wrapper:-ms-fullscreen .knowledge-card-popup {
  pointer-events: auto !important;
  position: relative !important;
  z-index: 10001 !important;
}

/* 确保在全屏模式下，当链接弹窗显示时，知识卡片弹窗不会阻止链接弹窗的显示 */
.video-wrapper:fullscreen .link-modal-overlay ~ .knowledge-card-popup-overlay,
.video-wrapper:-webkit-full-screen .link-modal-overlay ~ .knowledge-card-popup-overlay,
.video-wrapper:-moz-full-screen .link-modal-overlay ~ .knowledge-card-popup-overlay,
.video-wrapper:-ms-fullscreen .link-modal-overlay ~ .knowledge-card-popup-overlay {
  z-index: 9999 !important; /* 当链接弹窗显示时，知识卡片弹窗降低层级 */
}

</style>

<!-- 全屏模式样式 - 使用非scoped样式以确保能覆盖 -->
