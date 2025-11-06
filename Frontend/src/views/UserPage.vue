<template>
  <div class="user-container">
    <!-- 顶部标题栏保持不变 -->
    <header class="header">
      <h1>视频魔方</h1>
    </header>

    <!-- 视频编辑区域（支持滚动） -->
    <main class="video-main">
      <!-- 视频URL输入区 -->
      <div class="video-url-section">
        <div class="url-input-group">
          <label>视频链接</label>
          <div class="input-wrapper">
            <input type="text" v-model="videoUrl" placeholder="输入视频URL" class="url-input" />
            <button @click="loadVideo" class="load-btn">加载视频</button>
          </div>
        </div>
      </div>

      <!-- 视频播放区域（16:9横屏比例） -->
      <div class="video-player-container">
        <div v-if="!currentVideo" class="video-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">🎬</div>
            <p>视频预览区域</p>
            <div v-if="isEncoding" class="encoding-status">正在编码中请稍候...</div>
          </div>
        </div>
        <div v-else class="video-wrapper">
          <video
            :src="currentVideo"
            controls
            class="video-player"
            @timeupdate="handleTimeUpdate"
            @loadedmetadata="handleVideoLoaded"
          ></video>
          <!-- 视频时间显示 -->
          <div class="video-time-display">{{ currentTimeDisplay }} / {{ durationDisplay }}</div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="video-action-buttons">
        <button @click="saveProject" class="action-btn save-btn">保存项目</button>
        <button @click="exportProject" class="action-btn export-btn">导出为可分享链接</button>
        <button @click="uploadVideo" class="action-btn upload-btn">上传视频</button>
        <button @click="goToEditPage" class="action-btn edit-cards-btn">编辑知识卡片</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 视频相关数据
const videoUrl = ref('')
const currentVideo = ref('')
const currentTime = ref(0)
const duration = ref(0)
const isEncoding = ref(false)

// 计算属性
const currentTimeDisplay = computed(() => {
  const minutes = Math.floor(currentTime.value / 60)
  const seconds = Math.floor(currentTime.value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const durationDisplay = computed(() => {
  const minutes = Math.floor(duration.value / 60)
  const seconds = Math.floor(duration.value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// 方法
const loadVideo = () => {
  if (videoUrl.value.trim()) {
    isEncoding.value = true
    currentVideo.value = videoUrl.value
    setTimeout(() => {
      isEncoding.value = false
    }, 2000)
  }
}

const saveProject = () => {
  console.log('保存项目')
}

const exportProject = () => {
  console.log('导出为可分享链接')
}

const uploadVideo = () => {
  console.log('上传视频')
}

const goToEditPage = () => {
  router.push('/edit')
}

const handleTimeUpdate = (event: Event) => {
  const video = event.target as HTMLVideoElement
  currentTime.value = video.currentTime
}

const handleVideoLoaded = (event: Event) => {
  const video = event.target as HTMLVideoElement
  duration.value = video.duration
}
</script>

<style scoped>
.user-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

.header {
  background: #4682b4;
  color: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.video-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: white;
  overflow-y: auto;
  min-height: 0;
}

.video-url-section {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.url-input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.input-wrapper {
  display: flex;
  gap: 12px;
}

.url-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.url-input:focus {
  outline: none;
  border-color: #1890ff;
}

.load-btn {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.load-btn:hover {
  background: #40a9ff;
}

/* 视频播放区域 - 16:9横屏比例 */
.video-player-container {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9比例 (9/16=0.5625) */
  position: relative;
  background: #000;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  flex: none;
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background: #1a1a1a;
  flex-direction: column;
}

.placeholder-content {
  text-align: center;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.encoding-status {
  color: #1890ff;
  font-size: 14px;
  margin-top: 8px;
}

.video-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
  display: block;
}

.video-time-display {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: rgba(51, 51, 51, 0.8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 10;
}

.video-action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  flex-shrink: 0;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 100px;
}

.save-btn {
  background: #89b40b;
  color: white;
}

.export-btn {
  background: #2c5b9f;
  color: white;
}

.upload-btn {
  background: #89b40b;
  color: white;
}

.edit-cards-btn {
  background: #dc3545;
  color: white;
}

.action-btn:hover {
  opacity: 0.9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-main {
    padding: 16px;
  }
  
  .video-action-buttons {
    flex-wrap: wrap;
  }
  
  .action-btn {
    min-width: 80px;
    font-size: 13px;
    padding: 6px 12px;
  }
}

@media (min-width: 1200px) {
  .video-player-container {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>