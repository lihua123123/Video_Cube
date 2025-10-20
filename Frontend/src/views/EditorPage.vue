<template>
  <div class="editor-container">
    <!-- 顶部标题栏 -->
    <header class="header">
      <h1>视频魔方</h1>
    </header>
    
    <!-- 主要内容区 -->
    <main class="main-content">
      <!-- 左侧：视频编辑区 -->
      <section class="video-section">
        <!-- 视频URL输入区 -->
        <div class="video-url-section">
          <div class="url-input-group">
            <label>视频链接</label>
            <div class="input-wrapper">
              <input 
                type="text" 
                v-model="videoUrl" 
                placeholder="输入视频URL"
                class="url-input"
              >
              <button @click="loadVideo" class="load-btn">加载视频</button>
            </div>
          </div>
        </div>

        <!-- 视频播放区域 -->
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
            <div class="video-time-display">
              {{ currentTimeDisplay }} / {{ durationDisplay }}
            </div>
          </div>
        </div>

        <!-- 底部操作按钮  -->
        <div class="video-action-buttons">
          <button @click="saveProject" class="action-btn save-btn">保存项目</button>
          <button @click="exportProject" class="action-btn export-btn">导出为可分享链接</button>
          <button @click="uploadVideo" class="action-btn upload-btn">上传视频</button>
        </div>
      </section>

      <!-- 右侧：知识卡片编辑器 -->
      <section class="card-section">
        <div class="card-editor-header">
          <h2>知识卡片编辑器</h2>
        </div>

        <!-- 时间设置 -->
        <div class="time-setting">
          <label>卡片出现时间（秒）</label>
          <div class="time-input-wrapper">
            <input 
              type="number" 
              v-model="cardTime" 
              min="0" 
              step="1"
              class="time-input"
              value="23"
            >
          </div>
        </div>

        <!-- 富文本工具栏 - 使用你的图标文件 -->
        <div class="rich-text-toolbar">
          <button @click="formatText('bold')" class="tool-btn" title="加粗">
            <img :src="boldIcon" alt="加粗" class="tool-icon">
          </button>
          <button @click="formatText('italic')" class="tool-btn" title="斜体">
            <img :src="italicIcon" alt="斜体" class="tool-icon">
          </button>
          <button @click="formatText('link')" class="tool-btn" title="链接">
            <img :src="linkIcon" alt="链接" class="tool-icon">
          </button>
          <button @click="insertImage" class="tool-btn" title="插入图片">
            <img :src="imageIcon" alt="图片" class="tool-icon">
          </button>
          <button @click="insertFormula" class="tool-btn" title="插入公式">
            <img :src="formulaIcon" alt="公式" class="tool-icon">
          </button>
          <button @click="openColorPicker" class="tool-btn" title="颜色">
            <img :src="paletteIcon" alt="颜色" class="tool-icon">
          </button>
        </div>

        <!-- 卡片标题输入 -->
        <div class="card-title-input">
          <label>卡片标题</label>
          <input 
            type="text" 
            v-model="cardTitle" 
            placeholder="输入卡片标题"
            class="title-input"
            value="垂径定理"
          >
        </div>

        <!-- 卡片内容编辑 -->
        <div class="card-content-editor">
          <label>卡片内容</label>
          <textarea 
            v-model="cardContent" 
            rows="6" 
            placeholder="输入卡片内容..."
            class="content-textarea"
          >垂直于弦的直径平分这条弦，并且平分这条弦所对的两条弧。详细说明: 垂径定理_百度百科</textarea>
        </div>

        <!-- 卡片操作按钮 -->
        <div class="card-action-buttons">
          <button @click="saveCurrentCard" class="card-btn save-card-btn">保存当前卡片</button>
          <button @click="deleteCurrentCard" class="card-btn delete-card-btn">删除当前卡片</button>
          <button @click="addCardToList" class="card-btn add-card-btn">添加卡片至列表</button>
          <button @click="aiQuickAnalyze" class="card-btn ai-analysis-btn">AI快速分析</button>
        </div>

        <!-- 卡片列表 -->
        <div class="card-list-section">
          <h3>卡片列表</h3>
          <div class="cards-container">
            <!-- 示例卡片1 -->
            <div class="card-item" @click="selectCard(0)">
              <div class="card-header">
                <span class="card-time">15s</span>
                <span class="card-title">平行线的性质</span>
              </div>
              <div class="card-content-preview">
                1.两直线平行，同位角相等。
                2.两直线平行，内错角相等。
                3.两直线平行，同旁内角互补。
              </div>
            </div>
            
            <!-- 示例卡片2 -->
            <div class="card-item" @click="selectCard(1)">
              <div class="card-header">
                <span class="card-time">45s</span>
                <span class="card-title">牛顿第二定律</span>
              </div>
              <div class="card-content-preview">
                核心公式:F=ma
                F代表物体所受的合外力(单位:牛顿，N)
                m代表物体的质量(单位:千克，kg)
                a代表物体的加速度(单位:米/秒²，m/s²)
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 导入你的图标文件
import boldIcon from '@/assets/images/fa5-bold-fas.png'
import italicIcon from '@/assets/images/if-italic-alt.png'
import linkIcon from '@/assets/images/semiDesign-semi-icons-link.png'
import imageIcon from '@/assets/images/riLine-image-line.png'
import formulaIcon from '@/assets/images/iconPark-formula.png'
import paletteIcon from '@/assets/images/md-palette.png'

// 视频相关数据
const videoUrl = ref('')
const currentVideo = ref('')
const currentTime = ref(0)
const duration = ref(0)
const isEncoding = ref(false)

// 卡片编辑相关数据
const cardTime = ref(23)
const cardTitle = ref('垂径定理')
const cardContent = ref('垂直于弦的直径平分这条弦，并且平分这条弦所对的两条弧。详细说明: 垂径定理_百度百科')
const currentCardIndex = ref(-1)

// 示例卡片数据
const cardList = ref([
  {
    time: 15,
    title: '平行线的性质',
    content: '1.两直线平行，同位角相等。\n2.两直线平行，内错角相等。\n3.两直线平行，同旁内角互补。'
  },
  {
    time: 45,
    title: '牛顿第二定律', 
    content: '核心公式:F=ma\nF代表物体所受的合外力(单位:牛顿，N)\nm代表物体的质量(单位:千克，kg)\na代表物体的加速度(单位:米/秒²，m/s²)'
  }
])

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

// 视频相关方法
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

const handleTimeUpdate = (event: Event) => {
  const video = event.target as HTMLVideoElement
  currentTime.value = video.currentTime
}

const handleVideoLoaded = (event: Event) => {
  const video = event.target as HTMLVideoElement
  duration.value = video.duration
}

// 富文本编辑方法
const formatText = (type: string) => {
  console.log('格式化文本:', type)
}

const insertImage = () => {
  console.log('插入图片')
}

const insertFormula = () => {
  console.log('插入公式')
}

const openColorPicker = () => {
  console.log('打开颜色选择器')
}

// 卡片相关方法
const saveCurrentCard = () => {
  if (cardTitle.value && cardContent.value) {
    const cardData = {
      time: cardTime.value,
      title: cardTitle.value,
      content: cardContent.value,
      preview: cardContent.value.substring(0, 100) + '...'
    }

    if (currentCardIndex.value >= 0) {
      cardList.value[currentCardIndex.value] = cardData
    } else {
      cardList.value.push(cardData)
    }
    console.log('保存当前卡片')
  }
}

const deleteCurrentCard = () => {
  if (currentCardIndex.value >= 0) {
    cardList.value.splice(currentCardIndex.value, 1)
    resetCardForm()
  }
}

const addCardToList = () => {
  if (cardTitle.value && cardContent.value) {
    cardList.value.push({
      time: cardTime.value,
      title: cardTitle.value,
      content: cardContent.value,
      preview: cardContent.value.substring(0, 100) + '...'
    })
    resetCardForm()
  }
}

const aiQuickAnalyze = () => {
  console.log('AI快速分析')
}

const selectCard = (index: number) => {
  currentCardIndex.value = index
  const card = cardList.value[index]
  cardTime.value = card.time
  cardTitle.value = card.title
  cardContent.value = card.content
}

const resetCardForm = () => {
  cardTime.value = 0
  cardTitle.value = ''
  cardContent.value = ''
  currentCardIndex.value = -1
}
</script>

<style scoped>
.editor-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: #4580b0ff;
  color: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.main-content {
  flex: 1;
  display: flex;
  height: calc(100vh - 60px);
}

/* 左侧视频区域样式 */
.video-section {
  flex: 7;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: white;
  border-right: 1px solid #e8e8e8;
}

.video-url-section {
  margin-bottom: 20px;
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

.video-player-container {
  height: 500px;
  background: #000;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.video-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background: #1a1a1a;
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
  position: relative;
  height: 100%;
}

.video-player {
  width: 100%;
  height: calc(100% - 40px);
  background: #000;
}

.video-time-display {
  height: 40px;
  background: #333;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* 底部操作按钮 */
.video-action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-start; /* 左对齐 */
}

.action-btn {
  padding: 8px 16px; /* 更紧凑的尺寸 */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap; /* 防止文字换行 */
  min-width: 100px; /* 设置最小宽度 */
}

.save-btn { 
  background: #89B40B; 
  color: white;
}

.export-btn { 
  background: #2C5B9F; 
  color: white;
}

.upload-btn { 
  background: #89B40B; 
  color: white;
}

.action-btn:hover {
  opacity: 0.9;
}

/* 右侧卡片区域样式 */
.card-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  background: white;
  padding: 24px;
  overflow-y: auto;
}

.card-editor-header {
  margin-bottom: 24px;
}

.card-editor-header h2 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.time-setting {
  margin-bottom: 20px;
}

.time-setting label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.time-input-wrapper {
  display: flex;
}

.time-input {
  width: 100px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

/* 富文本工具栏样式 */
.rich-text-toolbar {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tool-btn:hover {
  background: #f0f0f0;
  border-color: #1890ff;
}

.tool-btn:hover::after {
  content: attr(title);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}

.tool-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.card-title-input {
  margin-bottom: 16px;
}

.card-title-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.title-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.card-content-editor {
  margin-bottom: 20px;
}

.card-content-editor label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.content-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

.card-action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 24px;
}

.card-btn {
  padding: 10px 12px;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.save-card-btn {
  background: #89B40B;
  color: white;
  border-color: #89B40B;
}

.delete-card-btn {
  background: #DC3545;
  color: white;
  border-color: #DC3545;
}

.add-card-btn {
  background: #2C5B9F;
  color: white;
  border-color: #2C5B9F;
}

.ai-analysis-btn {
  background: #23A1DF;
  color: white;
  border-color: #23A1DF;
}

.card-btn:hover {
  opacity: 0.9;
}

.card-list-section h3 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.card-item:hover {
  border-color: #1890ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-time {
  background: #1890ff;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
}

.card-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.card-content-preview {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  white-space: pre-wrap;
}
</style>