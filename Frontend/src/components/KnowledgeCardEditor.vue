<template>
  <div class="knowledge-card-editor">
    <!-- 编辑表单 -->
    <form @submit.prevent="handleSave" class="editor-form">
      <!-- 基本信息区 -->
      <div class="editor-section">
        <h3 class="section-title">基本信息</h3>
        <div class="form-group">
          <label for="card-title">卡片标题</label>
          <input 
            id="card-title"
            v-model="cardData.title" 
            type="text" 
            class="form-input"
            placeholder="请输入卡片标题"
            required
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="start-time">开始时间</label>
            <input 
              id="start-time"
              v-model="cardData.startTime" 
              type="number" 
              class="form-input"
              placeholder="秒"
              min="0"
              step="0.1"
              required
            />
          </div>
          <div class="form-group">
            <label for="end-time">结束时间</label>
            <input 
              id="end-time"
              v-model="cardData.endTime" 
              type="number" 
              class="form-input"
              placeholder="秒"
              min="0"
              step="0.1"
              required
            />
          </div>
        </div>
      </div>

      <!-- 富文本编辑区 -->
      <div class="editor-section">
        <h3 class="section-title">富文本内容</h3>
        
        <!-- 工具栏 -->
        <div class="toolbar">
          <button type="button" class="toolbar-btn" @click="formatText('bold')" title="加粗">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.6 11.8c1-.7 1.6-1.8 1.6-2.8 0-2.2-1.8-4-4-4H7v14h7.4c2.1 0 3.7-1.7 3.7-3.8 0-1.5-.8-2.8-2.1-3.4zM10 7h3c.6 0 1 .4 1 1s-.4 1-1 1h-3V7zm3 10H7v-2h6v2zm0-4H7v-2h6v2z"/>
            </svg>
          </button>
          <button type="button" class="toolbar-btn" @click="formatText('italic')" title="斜体">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
            </svg>
          </button>
          <button type="button" class="toolbar-btn" @click="insertLink" title="插入链接">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
            </svg>
          </button>
          <button type="button" class="toolbar-btn" @click="insertImage" title="插入图片">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </button>
          <button type="button" class="toolbar-btn" @click="formatText('h3')" title="标题3">
            H3
          </button>
          <button type="button" class="toolbar-btn" @click="formatText('ul')" title="无序列表">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
            </svg>
          </button>
          <button type="button" class="toolbar-btn" @click="formatText('blockquote')" title="引用">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
            </svg>
          </button>
          <button type="button" class="toolbar-btn" @click="formatText('code')" title="代码块">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
          </button>
        </div>

        <!-- 编辑区域 -->
        <div 
          class="editor-content" 
          contenteditable="true"
          @input="updateContent"
          @paste="handlePaste"
          ref="editorRef"
          placeholder="请输入卡片内容..."
        ></div>

        <!-- 内容预览 -->
        <div class="preview-section">
          <h4 class="preview-title">内容预览</h4>
          <div class="preview-content" v-html="previewContent"></div>
        </div>
      </div>

      <!-- 高级设置区 -->
      <div class="editor-section">
        <h3 class="section-title">高级设置</h3>
        <div class="form-group">
          <label for="content-type">内容类型</label>
          <select 
            id="content-type"
            v-model="cardData.content_type" 
            class="form-input"
          >
            <option value="rich_text">富文本</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>
        <div class="form-group">
          <label for="display-style">显示样式</label>
          <select 
            id="display-style"
            v-model="cardData.display_style" 
            class="form-input"
          >
            <option value="default">默认样式</option>
            <option value="compact">紧凑样式</option>
            <option value="expanded">展开样式</option>
          </select>
        </div>
      </div>

      <!-- 操作按钮区 -->
      <div class="editor-actions">
        <button type="button" class="secondary-button" @click="handleCancel">取消</button>
        <button type="submit" class="primary-button">保存卡片</button>
      </div>
    </form>

    <!-- 链接插入弹窗 -->
    <div v-if="showLinkModal" class="modal-overlay" @click.self="closeLinkModal">
      <div class="modal-content">
        <h3>插入链接</h3>
        <div class="form-group">
          <label>显示文本</label>
          <input v-model="linkText" type="text" class="form-input" placeholder="链接显示文本" />
        </div>
        <div class="form-group">
          <label>链接地址</label>
          <input v-model="linkUrl" type="url" class="form-input" placeholder="https://" required />
        </div>
        <div class="modal-actions">
          <button class="secondary-button" @click="closeLinkModal">取消</button>
          <button class="primary-button" @click="confirmLink">确认</button>
        </div>
      </div>
    </div>

    <!-- 图片插入弹窗 -->
    <div v-if="showImageModal" class="modal-overlay" @click.self="closeImageModal">
      <div class="modal-content">
        <h3>插入图片</h3>
        <div class="form-group">
          <label>图片URL</label>
          <input v-model="imageUrl" type="url" class="form-input" placeholder="https://" required />
        </div>
        <div class="form-group">
          <label>图片描述（可选）</label>
          <input v-model="imageAlt" type="text" class="form-input" placeholder="图片描述" />
        </div>
        <div class="modal-actions">
          <button class="secondary-button" @click="closeImageModal">取消</button>
          <button class="primary-button" @click="confirmImage">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

// 定义卡片接口
interface Card {
  id?: number;
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
  videoId: number;
  initialCard?: Card;
  currentVideoTime?: number;
}>();

// 定义事件
const emit = defineEmits<{
  save: [card: Card];
  cancel: [];
}>();

// 编辑器引用
const editorRef = ref<HTMLElement>();

// 卡片数据
const cardData = ref<Card>({
  video_id: props.videoId,
  startTime: props.currentVideoTime || 0,
  endTime: (props.currentVideoTime || 0) + 10,
  title: '',
  content: '',
  content_type: 'rich_text',
  display_style: 'default',
  is_ai_generated: false
});

// 弹窗状态
const showLinkModal = ref(false);
const showImageModal = ref(false);
const linkText = ref('');
const linkUrl = ref('');
const imageUrl = ref('');
const imageAlt = ref('');

// 预览内容
const previewContent = computed(() => {
  if (!cardData.value.content) return '<p class="placeholder">暂无内容</p>';
  
  // 这里使用与KnowledgeCardModal相同的内容处理逻辑
  let processed = cardData.value.content.replace(/\n/g, '<br>');
  
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
  
  // 处理链接
  processed = processed.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, 
    '<a href="$2" class="card-link" data-link="internal">$1</a>'
  );
  
  processed = processed.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" class="card-link" data-link="internal">$1</a>'
  );
  
  // 处理图片
  processed = processed.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g, 
    '<img src="$2" alt="$1" class="card-image">'
  );
  
  // 处理代码块
  processed = processed.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  return processed;
});

// 监听初始卡片变化
watch(() => props.initialCard, (newCard) => {
  if (newCard) {
    cardData.value = { ...newCard };
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.innerHTML = newCard.content;
      }
    });
  }
}, { immediate: true });

// 更新内容
const updateContent = () => {
  if (editorRef.value) {
    cardData.value.content = editorRef.value.innerHTML;
  }
};

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') || '';
  document.execCommand('insertText', false, text);
};

// 格式化文本
const formatText = (command: string) => {
  switch (command) {
    case 'bold':
      document.execCommand('bold', false);
      break;
    case 'italic':
      document.execCommand('italic', false);
      break;
    case 'h3':
      document.execCommand('formatBlock', false, '<h3>');
      break;
    case 'ul':
      document.execCommand('insertUnorderedList', false);
      break;
    case 'blockquote':
      document.execCommand('formatBlock', false, '<blockquote>');
      break;
    case 'code':
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        const selectedText = selection.toString();
        document.execCommand('insertHTML', false, `<pre><code>${selectedText}</code></pre>`);
      }
      break;
  }
  updateContent();
};

// 插入链接
const insertLink = () => {
  const selection = window.getSelection();
  if (selection && selection.toString()) {
    linkText.value = selection.toString();
  }
  showLinkModal.value = true;
};

// 确认链接
const confirmLink = () => {
  if (linkUrl.value) {
    const text = linkText.value || linkUrl.value;
    const markdownLink = `[${text}](${linkUrl.value})`;
    document.execCommand('insertText', false, markdownLink);
    updateContent();
  }
  closeLinkModal();
};

// 关闭链接弹窗
const closeLinkModal = () => {
  showLinkModal.value = false;
  linkText.value = '';
  linkUrl.value = '';
};

// 插入图片
const insertImage = () => {
  showImageModal.value = true;
};

// 确认图片
const confirmImage = () => {
  if (imageUrl.value) {
    const altText = imageAlt.value || '图片';
    const markdownImage = `![${altText}](${imageUrl.value})`;
    document.execCommand('insertText', false, markdownImage);
    updateContent();
  }
  closeImageModal();
};

// 关闭图片弹窗
const closeImageModal = () => {
  showImageModal.value = false;
  imageUrl.value = '';
  imageAlt.value = '';
};

// 保存卡片
const handleSave = () => {
  // 验证时间范围
  if (cardData.value.startTime >= cardData.value.endTime) {
    alert('结束时间必须大于开始时间');
    return;
  }
  
  emit('save', { ...cardData.value });
};

// 取消编辑
const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.knowledge-card-editor {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.editor-form {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.editor-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
}

.toolbar-btn {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #555;
  font-size: 12px;
}

.toolbar-btn:hover {
  background: #e9ecef;
  border-color: #667eea;
  color: #667eea;
}

/* 编辑器内容样式 */
.editor-content {
  min-height: 200px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 0 0 4px 4px;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  transition: border-color 0.2s;
}

.editor-content:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.editor-content[contenteditable="true"]:empty:before {
  content: attr(placeholder);
  color: #999;
  pointer-events: none;
}

/* 预览区域样式 */
.preview-section {
  margin-top: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.preview-title {
  background: #f8f9fa;
  padding: 12px 16px;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  border-bottom: 1px solid #e0e0e0;
}

.preview-content {
  padding: 16px;
  min-height: 100px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.preview-content .placeholder {
  color: #999;
  font-style: italic;
}

.preview-content h1,
.preview-content h2,
.preview-content h3 {
  margin: 12px 0 8px 0;
  color: #333;
}

.preview-content ul {
  padding-left: 24px;
  margin: 8px 0;
}

.preview-content li {
  margin-bottom: 4px;
}

.preview-content blockquote {
  margin: 8px 0;
  padding: 8px 16px;
  border-left: 4px solid #667eea;
  background-color: #f8f9ff;
  color: #555;
  font-style: italic;
}

.preview-content a {
  color: #667eea;
  text-decoration: none;
  border-bottom: 1px dotted #667eea;
}

.preview-content a:hover {
  color: #764ba2;
  border-bottom-style: solid;
}

.preview-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

.preview-content pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 8px 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}

.preview-content code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}

/* 操作按钮样式 */
.editor-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.primary-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 24px;
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

.secondary-button {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-button:hover {
  background: #f8f9ff;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .knowledge-card-editor {
    padding: 12px;
  }
  
  .editor-form {
    padding: 16px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .toolbar {
    flex-wrap: wrap;
  }
  
  .editor-actions {
    flex-direction: column-reverse;
  }
  
  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>