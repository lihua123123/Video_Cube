<template>
  <div 
    class="knowledge-card-modal-overlay" 
    v-if="isVisible" 
    @click="handleOverlayClick"
    :class="{ 'fade-in': isVisible }"
  >
    <div 
      class="knowledge-card-modal-content" 
      @click.stop
      :class="{ 'slide-in': isVisible }"
      ref="modalContentRef"
    >
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
        
        <!-- 关闭按钮 -->
        <button 
          class="close-button" 
          @click="handleClose"
          aria-label="关闭"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="knowledge-card-modal-body" v-if="currentCard">
        <div class="card-title-container">
          <h3 class="card-title">{{ currentCard.title }}</h3>
          <div v-if="currentCard.is_ai_generated" class="ai-badge">AI生成</div>
        </div>
        
        <!-- 卡片内容区域，添加淡入效果 -->
        <transition name="fade">
          <div 
            :key="currentCard.id || currentIndex"
            class="card-content" 
            v-html="processCardContent(currentCard.content)"
            @click="handleContentClick"
          ></div>
        </transition>
        
        <!-- 操作按钮区域 -->
        <div class="card-actions">
          <button 
            class="action-btn details-btn" 
            @click="viewCardDetails"
            :class="{ 'pulse': cards.length > 1 }"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            查看详情
          </button>
          <button class="action-btn close-btn" @click="handleClose">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

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
const props = defineProps<{
  isVisible: boolean;
  cards: Card[];
}>();

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

// 处理卡片内容，支持富文本显示
const processCardContent = (content: string): string => {
  if (!content) return '';
  
  // 这里可以复用UserPage.vue中的处理逻辑
  let processed = content.replace(/\n/g, '<br>');
  
  // 加粗和斜体
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  processed = processed.replace(/__(.*?)__/g, '<em>$1</em>');
  processed = processed.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // 标题处理
  processed = processed.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  processed = processed.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  processed = processed.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // 列表处理
  processed = processed.replace(/^- (.*$)/gm, '<li>$1</li>');
  processed = processed.replace(/<\/li>\s*<li>/g, '</li><li>');
  processed = processed.replace(/^(.*?)<li>/gm, '$1<ul><li>');
  processed = processed.replace(/<\/li>(.*?)$/gm, '</li></ul>$1');
  
  // 引用处理
  processed = processed.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
  
  // 处理链接（移除target="_blank"以支持内部弹窗）
  processed = processed.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, 
    '<a href="$2" class="card-link" data-link="internal">$1</a>'
  );
  
  processed = processed.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" class="card-link" data-link="internal">$1</a>'
  );
  
  // 处理颜色标记
  processed = processed.replace(
    /\[([^\]]+)\]\(color:([^)]+)\)/g, 
    '<span style="color: $2">$1</span>'
  );
  
  // 处理图片
  processed = processed.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g, 
    (match, alt, url) => {
      // 处理图片URL: Vite代理会自动处理 /uploads 路径
      let imageUrl = url;
      
      // 如果URL不是以 http 开头，且不是以 / 开头，则添加 /
      if (!url.startsWith('http') && !url.startsWith('/')) {
        imageUrl = '/' + url;
      }
      
      return `<img src="${imageUrl}" alt="${alt || '图片'}" class="card-image">`;
    }
  );
  
  // 处理代码块
  processed = processed.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  return processed;
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
  // 可以选择点击遮罩层不关闭，或者关闭
  // emit('close');
};
</script>

<style scoped>
/* 遮罩层样式 */
.knowledge-card-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001; /* 确保在其他弹窗之上 */
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.knowledge-card-modal-overlay.fade-in {
  opacity: 1;
}

/* 弹窗内容样式 */
.knowledge-card-modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transform: translateY(20px) scale(0.95);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.knowledge-card-modal-content.slide-in {
  transform: translateY(0) scale(1);
}

/* 头部样式 */
.knowledge-card-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom: none;
}

/* 卡片导航 */
.cards-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-index {
  font-size: 14px;
  font-weight: 500;
}

.nav-buttons {
  display: flex;
  gap: 4px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.nav-btn svg {
  width: 16px;
  height: 16px;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 卡片时间范围 */
.card-time-range {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
}

/* 关闭按钮 */
.close-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button svg {
  width: 20px;
  height: 20px;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 主体内容样式 */
.knowledge-card-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* 卡片标题 */
.card-title {
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

/* 卡片内容 */
.card-content {
  color: #555;
  line-height: 1.7;
  font-size: 15px;
  margin-bottom: 24px;
}

.card-content p {
  margin-bottom: 12px;
}

.card-content a {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px dotted #667eea;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.card-content a:hover {
  color: #764ba2;
  border-bottom-style: solid;
}

.card-content a::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #764ba2;
  transition: width 0.2s;
}

.card-content a:hover::after {
  width: 100%;
}

/* 图片样式 */
.card-content .card-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 12px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.card-content .card-image:hover {
  transform: scale(1.02);
}

/* 代码块样式 */
.card-content pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
  font-family: 'Courier New', Courier, monospace;
}

.card-content code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}

/* 引用样式 */
.card-content blockquote {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 4px solid #667eea;
  background-color: #f8f9ff;
  color: #555;
  font-style: italic;
}

/* 列表样式 */
.card-content ul {
  padding-left: 24px;
  margin: 12px 0;
}

.card-content li {
  margin-bottom: 4px;
}

/* 标题样式 */
.card-content h1,
.card-content h2,
.card-content h3 {
  margin: 16px 0 8px 0;
  color: #333;
}

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
  border-top: 1px solid #e8e8e8;
  padding-top: 16px;
  margin-top: 16px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.details-btn {
  background: #667eea;
  color: white;
}

.details-btn:hover {
  background: #764ba2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.close-btn {
  background: #f0f0f0;
  color: #666;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

/* 卡片标题容器 */
.card-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

/* AI生成标记 */
.ai-badge {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  animation: glow 2s ease-in-out infinite alternate;
}

/* 按钮图标 */
.btn-icon {
  margin-right: 6px;
  vertical-align: middle;
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
  }
}

.pulse {
  animation: pulse 2s infinite;
}

/* 卡片内容淡入效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 发光动画 */
@keyframes glow {
  from {
    box-shadow: 0 0 5px rgba(79, 172, 254, 0.5);
  }
  to {
    box-shadow: 0 0 10px rgba(79, 172, 254, 0.8), 0 0 20px rgba(0, 242, 254, 0.3);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .knowledge-card-modal-content {
    width: 95%;
    max-height: 80vh;
    margin: 10px;
  }
  
  .knowledge-card-modal-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>