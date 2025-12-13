<template>
  <div class="subtitle-display" :class="{ 'subtitle-active': currentSubtitle }">
    <!-- 字幕容器 -->
    <div v-if="subtitles.length > 0" class="subtitle-container">
      <transition name="subtitle-fade">
        <div v-if="currentSubtitle" class="subtitle-text" @click="handleSubtitleClick">
          {{ currentSubtitle.text }}
        </div>
      </transition>
    </div>

    <!-- 字幕控制面板 -->
    <div v-if="showControls" class="subtitle-controls">
      <button @click="toggleSubtitles" class="control-btn">
        <span>{{ subtitlesEnabled ? '隐藏字幕' : '显示字幕' }}</span>
      </button>
      
      <button v-if="!hasSubtitles" @click="generateSubtitles" class="control-btn generate-btn" :disabled="isGenerating">
        <span v-if="isGenerating">生成中...</span>
        <span v-else>🎤 生成字幕</span>
      </button>

      <button v-if="hasSubtitles" @click="showSubtitleList = !showSubtitleList" class="control-btn">
        <span>📝 字幕列表</span>
      </button>

      <button v-if="hasSubtitles" @click="searchSubtitles" class="control-btn">
        <span>🔍 搜索</span>
      </button>
    </div>

    <!-- 字幕列表侧边栏 -->
    <transition name="slide">
      <div v-if="showSubtitleList" class="subtitle-list-panel">
        <div class="panel-header">
          <h3>字幕列表 ({{ subtitles.length }})</h3>
          <button @click="showSubtitleList = false" class="close-btn">×</button>
        </div>
        
        <div class="subtitle-search">
          <input 
            v-model="searchKeyword" 
            type="text" 
            placeholder="搜索字幕内容..." 
            @input="handleSearch"
            class="search-input"
          />
        </div>

        <div class="subtitle-list">
          <div 
            v-for="(subtitle, index) in filteredSubtitles" 
            :key="index"
            class="subtitle-item"
            :class="{ 'active': currentSubtitle && currentSubtitle.index === subtitle.index }"
            @click="seekToSubtitle(subtitle)"
          >
            <div class="subtitle-time">{{ formatTime(subtitle.startTime) }}</div>
            <div class="subtitle-content" v-html="highlightKeyword(subtitle.text)"></div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 生成进度提示 -->
    <div v-if="isGenerating" class="generation-overlay">
      <div class="progress-box">
        <div class="loading-spinner"></div>
        <p>正在生成字幕，请稍候...</p>
        <p class="progress-text">{{ generationProgress }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

interface Subtitle {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
  duration: number;
}

const props = defineProps<{
  videoId: number;
  currentTime: number;
  showControls?: boolean;
}>();

const emit = defineEmits<{
  seek: [time: number];
  subtitleGenerated: [count: number];
}>();

// 状态
const subtitles = ref<Subtitle[]>([]);
const currentSubtitle = ref<Subtitle | null>(null);
const subtitlesEnabled = ref(true);
const hasSubtitles = ref(false);
const isGenerating = ref(false);
const generationProgress = ref('');
const showSubtitleList = ref(false);
const searchKeyword = ref('');
const filteredSubtitles = ref<Subtitle[]>([]);

// API 基础URL
const API_BASE = '/api/admin';

// 加载字幕
const loadSubtitles = async () => {
  try {
    const response = await axios.get(`${API_BASE}/subtitles/${props.videoId}?format=json`);
    subtitles.value = response.data.subtitles || [];
    filteredSubtitles.value = subtitles.value;
    hasSubtitles.value = subtitles.value.length > 0;
    console.log('✅ 字幕加载成功:', subtitles.value.length);
  } catch (err: any) {
    if (err.response?.status !== 404) {
      console.error('❌ 字幕加载失败:', err);
    }
    subtitles.value = [];
    hasSubtitles.value = false;
  }
};

// 生成字幕
const generateSubtitles = async () => {
  if (isGenerating.value) return;
  
  const confirmed = confirm('生成字幕需要几分钟时间，是否继续？');
  if (!confirmed) return;

  try {
    isGenerating.value = true;
    generationProgress.value = '正在提取音频...';

    const response = await axios.post(`${API_BASE}/subtitles/generate`, {
      video_id: props.videoId,
      language: 'en',
      formats: ['srt', 'vtt'],
      create_cards: true
    });

    generationProgress.value = '字幕生成成功！';
    
    // 重新加载字幕
    await loadSubtitles();
    
    emit('subtitleGenerated', response.data.data.knowledge_card_count);
    
    alert(`字幕生成成功！\n- 字幕段落: ${response.data.data.subtitle_count}\n- 知识卡片: ${response.data.data.knowledge_card_count}`);
  } catch (err: any) {
    console.error('❌ 字幕生成失败:', err);
    alert('字幕生成失败: ' + (err.response?.data?.message || err.message));
  } finally {
    isGenerating.value = false;
    generationProgress.value = '';
  }
};

// 切换字幕显示
const toggleSubtitles = () => {
  subtitlesEnabled.value = !subtitlesEnabled.value;
};

// 根据当前时间更新字幕
const updateCurrentSubtitle = () => {
  if (!subtitlesEnabled.value || subtitles.value.length === 0) {
    currentSubtitle.value = null;
    return;
  }

  const current = subtitles.value.find(
    s => props.currentTime >= s.startTime && props.currentTime <= s.endTime
  );

  currentSubtitle.value = current || null;
};

// 跳转到字幕时间点
const seekToSubtitle = (subtitle: Subtitle) => {
  emit('seek', subtitle.startTime);
  showSubtitleList.value = false;
};

// 点击字幕跳转
const handleSubtitleClick = () => {
  if (currentSubtitle.value) {
    showSubtitleList.value = true;
  }
};

// 搜索字幕
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    filteredSubtitles.value = subtitles.value;
    return;
  }

  const keyword = searchKeyword.value.toLowerCase();
  filteredSubtitles.value = subtitles.value.filter(s =>
    s.text.toLowerCase().includes(keyword)
  );
};

// 高亮关键词
const highlightKeyword = (text: string) => {
  if (!searchKeyword.value) return text;
  
  const regex = new RegExp(`(${searchKeyword.value})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// 搜索功能
const searchSubtitles = () => {
  showSubtitleList.value = true;
  setTimeout(() => {
    const input = document.querySelector('.search-input') as HTMLInputElement;
    input?.focus();
  }, 100);
};

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// 监听时间变化
watch(() => props.currentTime, updateCurrentSubtitle);

// 监听视频ID变化
watch(() => props.videoId, (newId) => {
  if (newId) {
    loadSubtitles();
  }
}, { immediate: true });

onMounted(() => {
  loadSubtitles();
});
</script>

<style scoped>
.subtitle-display {
  position: relative;
  width: 100%;
}

.subtitle-container {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 800px;
  text-align: center;
  pointer-events: none;
  z-index: 10;
}

.subtitle-text {
  display: inline-block;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 20px;
  line-height: 1.6;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  pointer-events: auto;
  max-width: 100%;
  word-wrap: break-word;
}

.subtitle-text:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.02);
  transition: all 0.2s;
}

.subtitle-fade-enter-active,
.subtitle-fade-leave-active {
  transition: opacity 0.3s;
}

.subtitle-fade-enter-from,
.subtitle-fade-leave-to {
  opacity: 0;
}

.subtitle-controls {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 12px;
}

.control-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.control-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.generate-btn {
  background: #2196F3;
}

.generate-btn:hover:not(:disabled) {
  background: #0b7dda;
}

.subtitle-list-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #ff5252;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.subtitle-search {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.subtitle-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.subtitle-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #f9f9f9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.subtitle-item:hover {
  background: #e3f2fd;
  transform: translateX(4px);
}

.subtitle-item.active {
  background: #bbdefb;
  border-left-color: #2196F3;
}

.subtitle-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 600;
}

.subtitle-content {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

.subtitle-content :deep(mark) {
  background: #ffeb3b;
  padding: 2px 4px;
  border-radius: 3px;
}

.generation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.progress-box {
  background: white;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-text {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
