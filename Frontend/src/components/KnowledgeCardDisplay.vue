<template>
  <div class="knowledge-card-display">
    <!-- 知识卡片容器 -->
    <div class="cards-container" :class="{ 'cards-visible': visibleCards.length > 0 }">
      <!-- 卡片列表 (移除内部头部,使用外部侧边栏头部) -->
      <div class="cards-list" v-if="visibleCards.length > 0">
        <div 
          v-for="card in visibleCards" 
          :key="card.id"
          class="knowledge-card"
          :class="{ 
            'expanded': expandedCardId === card.id,
            'minimized': isMinimized,
            'active': isCardActive(card),
            [card.display_style]: true
          }"
        >
          <!-- 卡片头部 -->
          <div class="card-header" @click="toggleCard(card.id)">
            <div class="card-title">{{ card.title }}</div>
            <div class="card-meta">
              <span 
                class="card-time clickable-time" 
                @click.stop="jumpToCardTime(card)"
                title="点击跳转到视频时间"
              >
                {{ formatTimeRange(card.startTime, card.endTime) }}
              </span>
              <button class="expand-btn" :title="expandedCardId === card.id ? '收起' : '展开'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path v-if="expandedCardId === card.id" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                  <path v-else d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- 卡片内容 -->
          <div class="card-content" @click="handleContentClick($event, card)">
            <div class="content-preview" v-html="generatePreview(card.content)"></div>
            <div v-if="!isExpanded(card.id) && needsExpansion(card.content)" class="expand-hint">
              点击展开更多内容...
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态提示 -->
      <div v-else-if="!isLoading && totalCards === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
        </svg>
        <div class="empty-text">暂无知识卡片</div>
        <div class="empty-hint">为此视频添加知识卡片以便学习</div>
      </div>
      
      <!-- 加载状态 -->
      <div v-else-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
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
const isMinimized = ref(false);

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

const needsExpansion = (content: string): boolean => {
  // 简单判断内容是否需要展开
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.length > 150;
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
    
    // 6. 限制长度（只在展开状态时显示完整内容）
    const plainText = html.replace(/<[^>]*>/g, '');
    if (plainText.length > 150) {
      // 简单截断，保留HTML标签完整性
      let truncated = '';
      let charCount = 0;
      let inTag = false;
      
      for (let i = 0; i < html.length && charCount < 150; i++) {
        const char = html[i];
        truncated += char;
        
        if (char === '<') {
          inTag = true;
        } else if (char === '>') {
          inTag = false;
        } else if (!inTag) {
          charCount++;
        }
      }
      
      // 确保标签完整闭合
      const openTags: string[] = [];
      const tagRegex = /<\/?([a-z][a-z0-9]*)/gi;
      let match;
      
      while ((match = tagRegex.exec(truncated)) !== null) {
        if (match[1]) {
          const tag = match[1].toLowerCase();
          if (match[0][1] !== '/') {
            openTags.push(tag);
          } else {
            const index = openTags.lastIndexOf(tag);
            if (index !== -1) {
              openTags.splice(index, 1);
            }
          }
        }
      }
      
      // 关闭所有未闭合的标签
      for (let i = openTags.length - 1; i >= 0; i--) {
        truncated += `</${openTags[i]}>`;
      }
      
      return truncated;
    }
    
    return html;
  } catch (error) {
    console.error('❌ Markdown 渲染失败:', error);
    // 如果解析失败,返回纯文本
    return content.substring(0, 150) + (content.length > 150 ? '...' : '');
  }
};

const formatTimeRange = (start: number, end: number): string => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const getContentTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'rich_text': '富文本',
    'markdown': 'Markdown'
  };
  return typeMap[type] || type;
};

const handleContentClick = (event: MouseEvent, card: KnowledgeCard) => {
  // 只处理链接点击事件,不再打开卡片详情
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
  // 移除了点击非链接区域打开详情的功能
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 卡片容器 */
.cards-container {
  background: white;
  overflow: hidden;
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 卡片容器可见状态 - 在侧边栏中不需要额外样式 */

/* 卡片列表 */
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

/* 美化滚动条 */
.cards-list::-webkit-scrollbar {
  width: 6px;
}

.cards-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.cards-list::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
  transition: background 0.3s;
}

.cards-list::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}

/* 知识卡片 */
.knowledge-card {
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  background: white;
  flex-shrink: 0; /* 防止被压缩 */
}

.knowledge-card:last-child {
  border-bottom: none;
}

.knowledge-card:hover {
  background-color: #fafafa;
}

.knowledge-card.active {
  background-color: #fff8e6;
  border-left: 3px solid #ffa940;
}

.knowledge-card.active .card-time {
  background: #ffa940;
  color: white;
}

.knowledge-card.expanded {
  background-color: #f8f9ff;
  border-left: 4px solid #667eea;
}

.knowledge-card.expanded.active {
  background: linear-gradient(to right, #fff8e6 0%, #f8f9ff 100%);
  border-left: 4px solid #667eea;
}

.knowledge-card.minimized .card-content {
  max-height: 0;
  overflow: hidden;
  padding: 0 20px;
}

/* 紧凑样式 */
.knowledge-card.compact .card-header {
  padding: 10px 16px;
}

.knowledge-card.compact .card-content {
  padding: 10px 16px;
  max-height: 100px;
}

/* 展开样式 */
.knowledge-card.expanded .card-content {
  max-height: 400px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.card-header:hover {
  background-color: rgba(102, 126, 234, 0.05);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.card-time {
  font-size: 12px;
  color: #667eea;
  font-family: 'Courier New', Courier, monospace;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

/* 可点击的时间样式 */
.clickable-time {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.clickable-time:hover {
  background: rgba(102, 126, 234, 0.25);
  color: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

.clickable-time:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(102, 126, 234, 0.2);
}

/* 时间图标提示 */
.clickable-time::before {
  content: '▶';
  font-size: 10px;
  margin-right: 4px;
  opacity: 1; /* 改为常驻显示 */
  transition: opacity 0.2s ease;
}

.clickable-time:hover::before {
  opacity: 0.8; /* 悬停时稍微调整透明度 */
}

.expand-btn {
  background: none;
  border: none;
  color: #667eea;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.expand-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

/* 卡片内容 */
.card-content {
  padding: 0 16px 12px 16px;
  max-height: 80px; /* 减少默认高度,显示更多卡片 */
  overflow-y: auto;
  transition: all 0.3s ease;
  cursor: default; /* 改为默认光标,因为不再可点击打开详情 */
  flex-shrink: 0;
}

/* 卡片内容滚动条样式 */
.card-content::-webkit-scrollbar {
  width: 4px;
}

.card-content::-webkit-scrollbar-track {
  background: transparent;
}

.card-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 2px;
}

.card-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

.content-preview {
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  word-break: break-word;
}

.content-preview strong,
.content-preview em {
  color: #333;
}

.content-preview a {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px dotted #667eea;
  transition: all 0.2s;
}

.content-preview a:hover {
  color: #764ba2;
  border-bottom-style: solid;
  cursor: pointer;
}

.content-preview a.card-link {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px solid #667eea;
  padding: 1px 2px;
  border-radius: 2px;
  transition: all 0.2s ease;
  background-color: rgba(102, 126, 234, 0.05);
  cursor: pointer;
}

.content-preview a.card-link:hover {
  color: #fff;
  background-color: #667eea;
  border-bottom-color: #667eea;
  text-decoration: none;
  transform: translateY(-0.5px);
  box-shadow: 0 1px 3px rgba(102, 126, 234, 0.3);
}

/* 预览图片样式 - 自适应大小 */
.content-preview img,
.content-preview img.preview-image,
.content-preview img.content-image {
  max-width: 100%;
  width: auto;
  height: auto;
  border-radius: 6px;
  margin: 8px auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
  max-height: 150px;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

/* 展开状态下的图片 - 允许更大尺寸 */
.knowledge-card.expanded .content-preview img,
.knowledge-card.expanded .content-preview img.preview-image {
  max-height: 300px;
}

.content-preview img:hover,
.content-preview img.preview-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.expand-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #667eea;
  font-style: italic;
  text-align: center;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
  min-height: 200px;
}

.empty-state svg {
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
  color: #666;
}

.empty-hint {
  font-size: 14px;
  opacity: 0.8;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #667eea;
  font-size: 14px;
}

/* 动画效果 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .knowledge-card-display {
    margin-top: 12px;
  }
  
  .cards-container {
    border-radius: 8px;
  }
  
  .cards-header {
    padding: 12px 16px;
  }
  
  .header-title {
    font-size: 14px;
  }
  
  .card-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .card-meta {
    width: 100%;
    justify-content: space-between;
  }
  
  .card-content {
    padding: 0 16px 12px;
    max-height: 120px;
  }
  
  .card-footer {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .empty-state {
    padding: 40px 16px;
  }
}
</style>