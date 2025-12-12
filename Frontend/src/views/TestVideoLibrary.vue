<template>
  <div class="test-page">
    <h1>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 8px;">
        <path d="M23 7l-7 5 7 5V7z"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg> 视频库数据测试页面
    </h1>
    
    <div class="test-section">
      <h2>1. API 数据测试</h2>
      <button @click="testAPI" class="test-btn">测试 API</button>
      <div v-if="apiResult" class="result-box">
        <div v-html="apiResult"></div>
      </div>
    </div>
    
    <div class="test-section">
      <h2>2. 缩略图加载测试</h2>
      <button @click="testThumbnails" class="test-btn">测试缩略图</button>
      <div v-if="thumbnailResult" class="result-box">
        <div v-for="(video, index) in testVideos" :key="index" class="video-card">
          <p><strong>视频 ID:</strong> {{ video.id }}</p>
          <p><strong>标题:</strong> {{ video.title }}</p>
          <p><strong>缩略图路径:</strong> {{ video.thumbnail_url }}</p>
          <p><strong>完整URL:</strong> {{ getFullUrl(video.thumbnail_url) }}</p>
          <img 
            :src="getFullUrl(video.thumbnail_url)" 
            class="thumbnail" 
            @error="handleImageError($event, video)"
            @load="handleImageLoad($event, video)"
            :alt="video.title"
          />
        </div>
      </div>
    </div>
    
    <div class="test-section">
      <h2>3. 视频卡片渲染测试</h2>
      <div v-if="renderedVideos.length > 0" class="cards-container">
        <div v-for="video in renderedVideos" :key="video.id" class="video-card">
          <img :src="getFullUrl(video.thumbnail_url)" class="thumbnail" :alt="video.title">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 4px;">
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg> {{ video.title }}
          </h4>
          <p>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 4px;">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg> {{ formatDate(video.created_at) }}
          </p>
          <p>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 4px;">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg> {{ formatDuration(video.duration) }}
          </p>
          <p>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 4px;">
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg> 状态: {{ video.status }}
          </p>
          <p class="id-text">ID: {{ video.id }}</p>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>4. 控制台日志</h2>
      <pre class="console-log">{{ consoleLog }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

interface Video {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const apiResult = ref('');
const thumbnailResult = ref(false);
const testVideos = ref<Video[]>([]);
const renderedVideos = ref<Video[]>([]);
const consoleLog = ref('');

const addLog = (message: string) => {
  consoleLog.value += message + '\n';
  console.log(message);
};

const testAPI = async () => {
  apiResult.value = '<p>正在请求...</p>';
  addLog('=== 测试 API 请求 ===');
  
  try {
    const response = await axios.get('/api/admin/videos', {
      params: { limit: 8, offset: 0 }
    });
    
    addLog(`✅ API 请求成功! 状态码: ${response.status}`);
    addLog(`总视频数: ${response.data.data.total}`);
    addLog(`返回视频数: ${response.data.data.videos.length}`);
    
    if (response.data.status) {
      const videos = response.data.data.videos;
      renderedVideos.value = videos;
      
      apiResult.value = `
        <p class="success">✅ API 请求成功!</p>
        <p>总视频数: ${response.data.data.total}</p>
        <p>返回视频数: ${videos.length}</p>
        <pre>${JSON.stringify(videos[0], null, 2)}</pre>
      `;
      
      if (videos.length > 0) {
        const v = videos[0];
        addLog('\n第一个视频的详细信息:');
        addLog(`- ID: ${v.id}`);
        addLog(`- 标题: ${v.title}`);
        addLog(`- 缩略图URL: ${v.thumbnail_url}`);
        addLog(`- 完整缩略图URL: ${getFullUrl(v.thumbnail_url)}`);
        addLog(`- 时长: ${v.duration}秒 -> ${formatDuration(v.duration)}`);
        addLog(`- 创建时间: ${v.created_at} -> ${formatDate(v.created_at)}`);
      }
    } else {
      apiResult.value = `<p class="error">❌ API 返回失败: ${response.data.message}</p>`;
      addLog(`❌ API 返回失败: ${response.data.message}`);
    }
  } catch (error: any) {
    apiResult.value = `<p class="error">❌ 请求失败: ${error.message}</p>`;
    addLog(`❌ 请求失败: ${error.message}`);
    if (error.response) {
      addLog(`响应状态: ${error.response.status}`);
      addLog(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
  }
};

const testThumbnails = async () => {
  thumbnailResult.value = false;
  addLog('\n=== 测试缩略图加载 ===');
  
  try {
    const response = await axios.get('/api/admin/videos', {
      params: { limit: 3, offset: 0 }
    });
    
    if (response.data.status && response.data.data.videos.length > 0) {
      testVideos.value = response.data.data.videos;
      thumbnailResult.value = true;
      addLog(`✅ 获取到 ${testVideos.value.length} 个视频,开始测试缩略图`);
    } else {
      addLog('❌ 没有视频数据');
    }
  } catch (error: any) {
    addLog(`❌ 测试失败: ${error.message}`);
  }
};

const getFullUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `/api${url}`;
};

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return date.toLocaleDateString('zh-CN');
};

const handleImageError = (event: Event, video: Video) => {
  const img = event.target as HTMLImageElement;
  img.style.border = '2px solid red';
  addLog(`❌ 缩略图加载失败: ${video.title} (${video.thumbnail_url})`);
};

const handleImageLoad = (event: Event, video: Video) => {
  const img = event.target as HTMLImageElement;
  img.style.border = '2px solid green';
  addLog(`✅ 缩略图加载成功: ${video.title}`);
};

// 页面加载时自动测试
testAPI();
</script>

<style scoped>
.test-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

h1 {
  color: #303133;
  margin-bottom: 30px;
}

.test-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #409eff;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.test-btn {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 15px;
}

.test-btn:hover {
  background: #66b1ff;
}

.result-box {
  margin-top: 15px;
}

.video-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  background: #fafafa;
}

.thumbnail {
  width: 200px;
  height: 112px;
  object-fit: cover;
  border-radius: 4px;
  margin: 10px 0;
  display: block;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.id-text {
  font-size: 12px;
  color: #999;
}

.console-log {
  background: #f0f0f0;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
}

.success {
  color: #67c23a;
  font-weight: bold;
}

.error {
  color: #f56c6c;
  font-weight: bold;
}

pre {
  background: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
