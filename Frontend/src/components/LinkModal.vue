<template>
  <div class="link-modal-overlay" v-if="isVisible" @click="closeModal">
    <div class="link-modal-content" @click.stop>
      <div class="link-modal-header">
        <h3>{{ title }}</h3>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      <div class="link-modal-body">
        <div v-if="loading" class="loading-indicator">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else-if="content" class="modal-content" v-html="content"></div>
        <div v-else class="no-content">
          <p>无相关内容</p>
        </div>
      </div>
      <div class="link-modal-footer">
        <button class="primary-button" @click="closeModal">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted } from 'vue';

// 定义属性
const props = defineProps<{
  isVisible: boolean;
  url: string;
  title: string;
}>();

// 定义事件
const emit = defineEmits<{
  close: [];
}>();

// 响应式状态
const loading = ref(false);
const content = ref<string | null>(null);

// 关闭模态框
const closeModal = () => {
  emit('close');
};

// 加载链接内容
const loadLinkContent = async () => {
  if (!props.url || !props.isVisible) return;
  
  loading.value = true;
  try {
    // 这里可以根据实际需求修改获取内容的方式
    // 例如，调用API获取链接对应的内容
    // 由于当前没有实际的API，这里使用模拟数据
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟内容，实际应用中应该从API获取
    if (props.url.includes('video_cube')) {
      content.value = `
        <div class="modal-rich-content">
          <h4>Video Cube 知识详情</h4>
          <p>Video Cube 是一款智能视频管理和知识标注工具，支持用户在视频播放过程中添加交互式知识卡片，实现内容的深度关联和展示。</p>
          <img src="https://via.placeholder.com/400x200" alt="Video Cube 示意图" style="max-width: 100%; height: auto; margin: 10px 0;">
          <ul>
            <li>支持视频时间点精确标注</li>
            <li>富文本内容编辑</li>
            <li>交互式知识卡片</li>
            <li>内联内容展示</li>
          </ul>
        </div>
      `;
    } else if (props.url.includes('tutorial')) {
      content.value = `
        <div class="modal-rich-content">
          <h4>使用教程</h4>
          <p>本教程将指导您如何使用Video Cube的知识卡片功能：</p>
          <ol>
            <li>在视频播放时暂停到特定时间点</li>
            <li>点击「编辑卡片」按钮</li>
            <li>填写卡片标题和内容</li>
            <li>设置卡片显示的时间段</li>
            <li>点击保存完成创建</li>
          </ol>
        </div>
      `;
    } else {
      content.value = `
        <div class="modal-rich-content">
          <p>链接内容预览：<strong>${props.url}</strong></p>
          <p>这里显示的是链接的详细说明信息，实际应用中会根据不同的链接类型显示相应的内容。</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('加载链接内容失败:', error);
    content.value = `<p class="error-message">加载内容失败，请稍后重试</p>`;
  } finally {
    loading.value = false;
  }
};

// 监听props变化
onMounted(() => {
  if (props.isVisible) {
    loadLinkContent();
  }
});
</script>

<style scoped>
/* 遮罩层样式 */
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
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

/* 模态框内容样式 */
.link-modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

/* 头部样式 */
.link-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.link-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

/* 关闭按钮 */
.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f8f9fa;
  color: #333;
}

/* 主体内容样式 */
.link-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #17a2b8;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

/* 模态框内容 */
.modal-content {
  line-height: 1.6;
  color: #555;
}

/* 富文本内容样式 */
.modal-rich-content h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
}

.modal-rich-content p {
  margin-bottom: 16px;
}

.modal-rich-content ul,
.modal-rich-content ol {
  padding-left: 24px;
  margin-bottom: 16px;
}

.modal-rich-content li {
  margin-bottom: 8px;
}

/* 错误信息样式 */
.error-message {
  color: #dc3545;
  font-weight: 500;
}

/* 底部按钮区域 */
.link-modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
}

/* 按钮样式 */
.primary-button {
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-button:hover {
  background-color: #138496;
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
</style>