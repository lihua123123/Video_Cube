<template>
  <div class="knowledge-card-display">
    <!-- 知识卡片容器 -->
    <div class="cards-container" :class="{ 'cards-visible': visibleCards.length > 0 }">
      <!-- 卡片列表 -->
      <div class="cards-list" v-if="visibleCards.length > 0">
        <div 
          v-for="card in visibleCards" 
          :key="card.id"
          class="knowledge-card-optimized"
          :class="{ 
            'active': isCardActive(card),
            'expanded': expandedCardId === card.id
          }"
        >
          <!-- 卡片头部 -->
          <div class="card-header-optimized" @click.stop="toggleCard(card.id)">
            <span class="card-badge">{{ getCardType(card) }}</span>
            <span 
              class="card-time clickable-time" 
              @click.stop="jumpToCardTime(card)"
              title="点击跳转到视频时间"
            >
              {{ formatCardTime(card.startTime) }}
            </span>
          </div>
          
          <!-- 卡片标题 -->
          <h4 class="card-title-optimized" @click.stop="toggleCard(card.id)">{{ card.title }}</h4>
          
          <!-- 卡片内容 - 只在展开状态下显示 -->
          <div v-if="isExpanded(card.id)" class="card-content-optimized" @click.stop="handleContentClick($event)">
            <div class="content-preview" v-html="generatePreview(card.content)"></div>
          </div>
          
          <!-- 卡片底部 - 统一显示查看和展开/收起按钮 -->
          <div class="card-footer-optimized">
            <button class="card-action-btn view" @click.stop="handleCardClick(card)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              查看
            </button>
            <button class="card-action-btn expand" @click.stop="toggleCard(card.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path v-if="expandedCardId === card.id" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                <path v-else d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
              {{ expandedCardId === card.id ? '收起' : '展开' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- 空状态提示 -->
      <div v-else-if="!isLoading && totalCards === 0" class="empty-state-optimized">
        <div class="empty-icon">📚</div>
        <div class="empty-text">暂无知识卡片</div>
        <div class="empty-hint">为此视频添加知识卡片以便学习</div>
      </div>
      
      <!-- 加载状态 -->
      <div v-else-if="isLoading" class="loading-state-optimized">
        <div class="spinner"></div>
        <div class="loading-text">加载知识卡片中...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
const props = defineProps<{
  cards: KnowledgeCard[];
  currentTime: number;
  videoDuration: number;
  isLoading?: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  cardClick: [card: KnowledgeCard];
  cardLinkClick: [url: string];
  seekToTime: [time: number];
}>();

// 内部状态
const expandedCardId = ref<number | null>(null);

// 计算属性
const totalCards = computed(() => props.cards.length);

// 根据当前时间筛选可见卡片
const visibleCards = computed(() => {
  // 显示所有卡片,不再根据时间筛选
  // 但可以根据时间高亮当前激活的卡片
  return props.cards;
});

// 监听可见卡片变化，自动展开第一个卡片
watch(visibleCards, (newCards) => {
  // 如果有新的可见卡片且没有展开的卡片，则展开第一个
  if (newCards.length > 0 && !expandedCardId.value && newCards[0]) {
    expandedCardId.value = newCards[0].id;
  }
  // 如果展开的卡片不在可见卡片列表中，则清除
  if (expandedCardId.value && !newCards.some(card => card.id === expandedCardId.value)) {
    expandedCardId.value = null;
  }
}, { deep: true });

// 方法
const isCardActive = (card: KnowledgeCard): boolean => {
  return props.currentTime >= card.startTime && props.currentTime <= card.endTime;
};

const isExpanded = (cardId: number): boolean => {
  return expandedCardId.value === cardId;
};

const toggleCard = (cardId: number) => {
  if (expandedCardId.value === cardId) {
    expandedCardId.value = null;
  } else {
    expandedCardId.value = cardId;
  }
};

const generatePreview = (content: string): string => {
  try {
    // 1. 使用 marked 解析 Markdown
    let html = marked.parse(content) as string;
    
    // 2. 修复图片 URL (marked 已经将 Markdown 图片转换为 HTML img 标签)
    html = html.replace(/<img([^>]*)src="([^"]+)"([^>]*)>/gi, (match, before, url, after) => {
      let imageUrl = url;
      
      // 🔧 修复旧的 localhost:5173 URL
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
      
      // 添加必要的类名和属性
      return `<img${before}src="${imageUrl}"${after} class="content-image preview-image" loading="lazy">`;
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
    
    // 5. 使用 DOMPurify 清理 HTML
    html = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'del', 's', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'hr', 'mark', 'table', 'thead', 
                     'tbody', 'tr', 'th', 'td', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'loading']
    });
    
    // 始终返回完整内容，展开/收起由v-if控制
    return html;
  } catch (error) {
    console.error('❌ Markdown 渲染失败:', error);
    // 如果解析失败,返回纯文本
    return content.substring(0, 150) + (content.length > 150 ? '...' : '');
  }
};

const formatCardTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getCardType = (card: KnowledgeCard): string => {
  const typeMap: Record<string, string> = {
    'rich_text': '富文本',
    'markdown': 'Markdown',
    'text': '文本'
  };
  return typeMap[card.content_type] || card.content_type;
};

const handleContentClick = (event: MouseEvent) => {
  // 只处理链接点击事件
  const target = event.target as HTMLElement;
  
  // 专门检测带有card-link类的链接
  if (target.tagName === 'A' && target.classList.contains('card-link')) {
    event.preventDefault();
    const url = target.getAttribute('href') || '';
    // 确保URL不为空且有效
    if (url) {
      console.log('Link clicked:', url);
      emit('cardLinkClick', url);
    }
  } else if (target.closest('a.card-link')) {
    // 处理链接内部元素的点击
    const linkElement = target.closest('a.card-link')!;
    event.preventDefault();
    const url = linkElement.getAttribute('href') || '';
    if (url) {
      console.log('Link clicked via child element:', url);
      emit('cardLinkClick', url);
    }
  }
};

const handleCardClick = (card: KnowledgeCard) => {
  emit('cardClick', card);
};

// 点击时间跳转到视频对应位置
const jumpToCardTime = (card: KnowledgeCard) => {
  console.log(`⏱️ 跳转到卡片"${card.title}"的时间: ${card.startTime}s`);
  emit('seekToTime', card.startTime);
};
</script>

<style scoped>
/* 知识卡片展示容器 */
.knowledge-card-display {
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 卡片容器 */
.cards-container {
  background: transparent;
  overflow: hidden;
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 卡片列表 */
.cards-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* 移除最大高度限制，让卡片列表完全自适应内容 */
}

/* 美化滚动条 */
.cards-list::-webkit-scrollbar {
  width: 6px;
}

.cards-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.cards-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: background 0.3s;
}

.cards-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 优化的知识卡片样式 - 与Popup保持一致 */
.knowledge-card-optimized {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f8f7f5 100%);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(31, 58, 82, 0.08);
  border: 1px solid rgba(212, 165, 116, 0.15);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  overflow: visible;
  display: flex;
  flex-direction: column;
  min-height: auto; /* 自动高度，根据内容调整 */
  min-height: min-content;
}

.knowledge-card-optimized:hover,
.knowledge-card-optimized.active {
  border-color: #4A9FB8;
  box-shadow: 0 15px 50px rgba(31, 58, 82, 0.15);
  transform: translateY(-2px);
}

.knowledge-card-optimized.expanded {
  background: linear-gradient(135deg, #ffffff 0%, #f8f7f5 100%);
  border-left: 4px solid #D4A574;
  /* 移除固定最小高度，根据内容自适应 */
  max-height: none; /* 移除最大高度限制 */
  height: auto; /* 高度自适应内容 */
}

/* 卡片头部 - 与Popup保持一致的蓝色渐变 */
.card-header-optimized {
  background: linear-gradient(135deg, #1b2a31 0%, #243841 100%);
  padding: 16px 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}

.card-badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  letter-spacing: 0.5px;
}

.card-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 8px;
}

/* 可点击的时间样式 */
.clickable-time {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.clickable-time:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* 卡片标题 */
.card-title-optimized {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1F3A52;
  line-height: 1.4;
  overflow: visible;
  text-overflow: unset;
  display: block;
  padding: 16px 20px 12px; /* 增加上下内边距，给标题更多空间 */
  cursor: pointer;
  transition: color 0.3s ease;
}

.card-title-optimized:hover {
  color: #4A9FB8;
}

/* 卡片内容 */
.card-content-optimized {
  padding: 0 20px 20px; /* 增加底部内边距 */
  /* 移除固定最大高度，根据内容自适应 */
  transition: all 0.3s ease;
  cursor: default;
  min-height: 0;
}

.knowledge-card-optimized.expanded .card-content-optimized {
  max-height: none; /* 移除高度限制，让内容完全展开 */
  overflow-y: visible; /* 移除滚动条，完整显示内容 */
}

/* 卡片内容滚动条样式 */
.card-content-optimized::-webkit-scrollbar {
  width: 6px;
}

.card-content-optimized::-webkit-scrollbar-track {
  background: transparent;
}

.card-content-optimized::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.content-preview {
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  word-break: break-word;
  width: 100%;
  box-sizing: border-box;
}

/* 内容样式 - 与Popup保持一致 */
.content-preview h1,
.content-preview h2,
.content-preview h3 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #222;
  font-weight: 600;
}

.content-preview h1 {
  font-size: 20px;
}

.content-preview h2 {
  font-size: 18px;
}

.content-preview h3 {
  font-size: 16px;
}

.content-preview p {
  margin: 8px 0;
}

.content-preview strong {
  font-weight: 600;
  color: #222;
}

.content-preview em {
  font-style: italic;
}

.content-preview code {
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.content-preview pre {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  max-width: 100%;
  box-sizing: border-box;
  font-size: 13px;
}

.content-preview ul,
.content-preview ol {
  margin: 8px 0;
  padding-left: 24px;
}

.content-preview li {
  margin: 4px 0;
}

.content-preview blockquote {
  border-left: 4px solid #667eea;
  padding: 12px 16px;
  margin: 12px 0;
  color: #555;
  font-style: italic;
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.05), transparent);
  border-radius: 4px;
  max-width: 100%;
  box-sizing: border-box;
}

/* 链接样式 - 与Popup保持一致 */
.content-preview a.card-link {
  color: #4A9FB8;
  text-decoration: none;
  border-bottom: 2px solid #D4A574;
  padding: 2px;
  border-radius: 2px;
  background-color: transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.content-preview a.card-link:hover {
  color: #1F3A52;
  border-bottom-color: #4A9FB8;
  background-color: transparent;
  transform: translateY(-0.5px);
}

/* 预览图片样式 - 与Popup保持一致 */
.content-preview img,
.content-preview img.preview-image,
.content-preview img.content-image {
  max-width: 100%;
  width: auto;
  height: auto;
  display: block;
  margin: 12px auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: zoom-in;
  transition: transform 0.2s, box-shadow 0.2s;
  object-fit: contain;
  max-height: 200px;
}

/* 展开状态下的图片 - 与Popup保持一致 */
.knowledge-card-optimized.expanded .content-preview img,
.knowledge-card-optimized.expanded .content-preview img.preview-image {
  max-height: none; /* 移除图片高度限制，让图片完整显示 */
}

.content-preview img:hover,
.content-preview img.preview-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.expand-hint {
  margin-top: 8px;
  font-size: 0.8rem;
  color: #D4A574;
  font-style: italic;
  text-align: center;
}

/* 卡片底部 */
.card-footer-optimized {
  padding: 16px 20px;
  background: rgba(248, 247, 245, 0.8);
  border-top: 1px solid rgba(212, 165, 116, 0.15);
  display: flex;
  gap: 12px;
  margin-top: auto; /* 确保按钮始终在底部 */
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}

/* 按钮样式 - 与Popup保持一致 */
.card-action-btn {
  flex: 1;
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.card-action-btn.view {
  background: linear-gradient(135deg, #1b2a31 0%, #243841 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(27, 42, 49, 0.2);
}

.card-action-btn.view:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(36, 56, 65, 0.4);
}

.card-action-btn.expand {
  background: rgba(212, 165, 116, 0.15);
  color: #1F3A52;
  border: 1px solid rgba(212, 165, 116, 0.3);
}

.card-action-btn.expand:hover {
  background: #D4A574;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 165, 116, 0.3);
}

/* 优化的空状态 */
.empty-state-optimized {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #8B8680;
  text-align: center;
  min-height: 200px;
  background: transparent;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #2D2D2D;
  font-weight: 500;
}

.empty-hint {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 优化的加载状态 */
.loading-state-optimized {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #8B8680;
  background: transparent;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #D4A574;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  color: #D4A574;
  font-size: 0.9rem;
}

/* 动画效果 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}



/* 响应式设计 */
@media (max-width: 768px) {
  .card-header-optimized {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 12px 16px;
  }
  
  .card-title-optimized {
    font-size: 15px;
    padding: 10px 16px 6px;
    overflow: visible;
    text-overflow: unset;
    display: block;
  }
  
  .card-content-optimized {
    padding: 0 16px 12px;
  }
  
  .card-footer-optimized {
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
  }
  
  .card-action-btn {
    padding: 10px 16px;
    font-size: 14px;
    min-height: 40px; /* 确保按钮有足够高度 */
  }
  
  .cards-list {
    gap: 12px;
    padding: 0.5rem;
  }
  
  .knowledge-card-optimized {
    min-height: auto; /* 移动端自动高度 */
    min-height: min-content;
  }
}

@media (max-width: 480px) {
  .card-header-optimized {
    padding: 10px 14px;
  }
  
  .card-title-optimized {
    font-size: 14px;
    padding: 8px 14px 4px;
    overflow: visible;
    text-overflow: unset;
    display: block;
  }
  
  .card-content-optimized {
    padding: 0 14px 10px;
  }
  
  .card-footer-optimized {
    padding: 10px 14px;
    gap: 6px;
  }
  
  .card-action-btn {
    padding: 8px 12px;
    font-size: 13px;
    min-height: 36px;
  }
  
  .card-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
  }
  
  .card-time {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .knowledge-card-optimized {
    min-height: auto; /* 小屏幕自动高度 */
    min-height: min-content;
  }
}
</style>