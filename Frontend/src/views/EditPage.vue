<template>
  <div class="edit-container">
    <!-- 错误提示 -->
    <div v-if="showError" class="error-notification">
      {{ errorMessage }}
    </div>

    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">处理中...</div>
    </div>

    <!-- 顶部标题栏 - 应用玻璃态效果 -->
    <header class="premium-header glass-card">
      <div class="header-content">
        <div class="logo-section">
          <h1 class="app-title">知识卡片编辑器</h1>
          <p class="subtitle">Knowledge Card Editor</p>
        </div>
        <div class="header-actions">
          <button @click="goBack" class="premium-action-btn back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            返回视频页面
          </button>
          <!-- 保存项目按钮已删除 -->
        </div>
      </div>
    </header>

    <!-- 主内容区 - 三栏布局 -->
    <main class="main-content premium-main-content">
      <!-- 左侧：我的项目侧边栏 -->
      <section class="project-sidebar glass-card">
        <div class="sidebar-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="sidebar-icon">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <h3 class="sidebar-title">我的项目</h3>
        </div>
        <div class="project-list">
          <!-- 项目列表已清空 -->
          <div class="empty-projects">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="empty-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            
          </div>
        </div>
      </section>

      <!-- 中间：卡片编辑 -->
      <section class="card-editor-section glass-card">
        <div class="editor-header premium-editor-header">
          <div class="editor-title-section">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="editor-icon">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <h2 class="editor-title">卡片编辑</h2>
          </div>
          <div class="editor-actions premium-actions">
            <button @click="aiAnalyze" class="premium-action-btn ai-analysis-btn" :disabled="isLoading">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
              AI分析
            </button>
            <button @click="addNewCard" class="premium-action-btn add-card-btn" :disabled="isLoading">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              + 新增卡
            </button>
            <div class="batch-actions">
              <button @click="selectAllCards" class="premium-action-btn select-all-btn" :disabled="isLoading">
                {{ isAllSelected ? '取消全选' : '全选' }}
              </button>
              <button 
                @click="batchDeleteCards" 
                class="premium-action-btn batch-delete-btn" 
                :disabled="batchSelectedCards.length === 0"
              >
                批量删除 ({{ batchSelectedCards.length }})
              </button>
            </div>
          </div>
        </div>

        <!-- 卡片列表 -->
        <div class="card-list-container">
          <h4>卡片列表 ({{ showExampleCards ? exampleCards.length : userCards.length }}) - 已选 {{ selectedCardsCount }} 张</h4>
          
          <!-- 提示查看示例卡片 -->
          <div v-if="!showExampleCards && userCards.length === 0" class="example-cards-tip" @click="toggleExampleCards">
            <span class="tip-text">📚 点击查看示例卡片</span>
          </div>
          
          <!-- 示例卡片标题栏 -->
          <div v-if="showExampleCards" class="example-cards-header">
            <span class="example-title">示例卡片</span>
            <button @click="toggleExampleCards" class="close-example-btn" title="关闭示例">
              × 关闭示例
            </button>
          </div>

          <div class="cards-list">
            <!-- 显示示例卡片 -->
            <div
              v-for="(card, index) in exampleCards"
              :key="'example-' + index"
              v-if="showExampleCards"
              :class="['card-item', 'example-card']"
            >
              <div class="card-header">
                <span class="card-time">{{ card.startTime }}s - {{ card.endTime }}s</span>
                <span class="card-title">{{ card.title }}</span>
                <div class="card-actions">
                  <div class="example-badge">示例</div>
                </div>
              </div>

              <!-- 卡片内容 -->
              <div class="card-content">
                <div class="summary-content">
                  {{ card.summary }}
                </div>
              </div>
            </div>

            <!-- 显示用户创建的卡片 -->
            <div
              v-for="(card, index) in userCards"
              :key="'user-' + index"
              v-if="!showExampleCards"
              :class="['card-item', { 
                active: selectedCardIndex === index,
                'batch-selected': batchSelectedCards.includes(index)
              }]"
              @click="handleCardClick(index)"
            >
              <!-- 卡片头部 -->
              <div class="card-header">
                <span 
                  class="card-time clickable-time" 
                  @click.stop="jumpToCardTimeByIndex(index)"
                  title="点击跳转到视频时间"
                >
                  {{ card.startTime }}s - {{ card.endTime }}s
                </span>
                <span class="card-title">{{ card.title }}</span>
                <div class="card-actions">
                  <!-- 编辑和删除按钮 - 只在选中单个卡片且没有批量选择时显示 -->
                  <div 
                    v-if="selectedCardIndex === index && batchSelectedCards.length === 0" 
                    class="single-card-actions"
                  >
                    <img 
                      src="@/assets/images/iconEdit.png" 
                      alt="编辑" 
                      class="action-icon"
                      @click.stop="editCard(index)"
                      title="编辑卡片"
                    >
                    <img 
                      src="@/assets/images/iconDelete.png" 
                      alt="删除" 
                      class="action-icon"
                      @click.stop="deleteSingleCard(index)"
                      title="删除卡片"
                    >
                  </div>
                  
                  <div v-if="batchSelectedCards.includes(index)" class="selection-indicator">
                    ✓
                  </div>
                </div>
              </div>

              <!-- 卡片内容 -->
              <div class="card-content">
                <div class="summary-content">
                  {{ card.summary }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：视频预览 -->
      <section class="video-preview-section glass-card">
        <div class="preview-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="preview-icon">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          <h3 class="preview-title">视频预览</h3>
        </div>
        <div class="video-preview-container">
          <!-- 只有当videoUrl有值时才渲染视频元素 -->
          <video 
            v-if="videoUrl"
            ref="videoElement"
            class="video-player"
            :src="videoUrl"
            @timeupdate="updateVideoTime"
            @loadedmetadata="handleVideoLoaded"
            @error="handleVideoError"
            controls
          ></video>
          <!-- 视频加载中提示 -->
          <div v-else class="video-loading-placeholder">
            <p>正在加载视频...</p>
          </div>
          <!-- 视频时间显示 -->
          <div class="video-time">{{ formattedVideoTime }}</div>
        </div>
        
        <!-- 知识卡片时间轴 -->
        <div class="cards-timeline" v-if="videoDuration > 0">
          <div class="timeline-header">
            <span class="timeline-title">📍 知识卡片时间轴</span>
            <span class="timeline-count">({{ userCards.length }} 张)</span>
          </div>
          <div class="timeline-track">
            <!-- 当前播放进度条 -->
            <div 
              class="timeline-progress" 
              :style="{ width: (currentVideoTime / videoDuration * 100) + '%' }"
            ></div>
            
            <!-- 卡片标记 -->
            <div
              v-for="(card, index) in userCards"
              :key="'timeline-' + index"
              class="timeline-card-marker"
              :class="{ 
                active: selectedCardIndex === index,
                current: isCardCurrentlyPlaying(card)
              }"
              :style="{
                left: (card.startTime / videoDuration * 100) + '%',
                width: ((card.endTime - card.startTime) / videoDuration * 100) + '%'
              }"
              @click="selectAndJumpToCard(index)"
              :title="`${card.title}\n${card.startTime}s - ${card.endTime}s`"
            >
              <span class="marker-index">{{ index + 1 }}</span>
            </div>
          </div>
          
          <!-- 时间刻度 -->
          <div class="timeline-scale">
            <span class="scale-mark">0:00</span>
            <span class="scale-mark" v-if="videoDuration >= 30">{{ formatTime(videoDuration / 4) }}</span>
            <span class="scale-mark" v-if="videoDuration >= 60">{{ formatTime(videoDuration / 2) }}</span>
            <span class="scale-mark" v-if="videoDuration >= 90">{{ formatTime(videoDuration * 3 / 4) }}</span>
            <span class="scale-mark">{{ formattedVideoDuration }}</span>
          </div>
        </div>
        
        <!-- 视频控制按钮组 -->
        <div class="video-controls">
          <button @click="playPauseVideo" class="control-btn">
            {{ isPlaying ? '暂停' : '播放' }}
          </button>
          <div class="video-info">
            <span>总时长: {{ formattedVideoDuration }}</span>
          </div>
        </div>
      </section>
    </main>

    <!-- 新增卡片模态弹窗 -->
    <div v-if="showCardModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingCardIndex >= 0 ? '编辑知识卡片' : '新增知识卡片' }}</h3>
          <button @click="closeModal" class="modal-close">×</button>
        </div>

        <div class="modal-body">
          <!-- 时间设置 - 修改为时间段选择 -->
          <div class="time-setting">
            <label>卡片出现时间段</label>
            <div class="time-range-wrapper">
              <!-- 开始时间 -->
              <div class="time-input-section">
                <span class="time-label">开始时间：</span>
                <div class="time-input-group">
                  <div class="time-input-item" v-if="showHoursInput">
                    <input 
                      type="number" 
                      v-model="startHours" 
                      @input="handleStartTimeChange"
                      min="0"
                      placeholder="时"
                      class="time-input" 
                    />
                    <span class="time-unit">时</span>
                  </div>
                  <div class="time-input-item" v-if="showMinutesInput">
                    <input 
                      type="number" 
                      v-model="startMinutes" 
                      @input="handleStartTimeChange"
                      min="0"
                      max="59"
                      placeholder="分"
                      class="time-input" 
                    />
                    <span class="time-unit">分</span>
                  </div>
                  <div class="time-input-item">
                    <input 
                      type="number" 
                      v-model="startSeconds" 
                      @input="handleStartTimeChange"
                      min="0"
                      max="59"
                      placeholder="秒"
                      class="time-input" 
                    />
                    <span class="time-unit">秒</span>
                  </div>
                </div>
              </div>
              
              <!-- 结束时间 -->
              <div class="time-input-section">
                <span class="time-label">结束时间：</span>
                <div class="time-input-group">
                  <div class="time-input-item" v-if="showHoursInput">
                    <input 
                      type="number" 
                      v-model="endHours" 
                      @input="handleEndTimeChange"
                      min="0"
                      placeholder="时"
                      class="time-input" 
                    />
                    <span class="time-unit">时</span>
                  </div>
                  <div class="time-input-item" v-if="showMinutesInput">
                    <input 
                      type="number" 
                      v-model="endMinutes" 
                      @input="handleEndTimeChange"
                      min="0"
                      max="59"
                      placeholder="分"
                      class="time-input" 
                    />
                    <span class="time-unit">分</span>
                  </div>
                  <div class="time-input-item">
                    <input 
                      type="number" 
                      v-model="endSeconds" 
                      @input="handleEndTimeChange"
                      min="0"
                      max="59"
                      placeholder="秒"
                      class="time-input" 
                    />
                    <span class="time-unit">秒</span>
                  </div>
                </div>
              </div>
              
              <div class="time-duration" v-if="timeDuration > 0">
                时长：{{ formatDuration(timeDuration) }}
              </div>
              <button @click="fillTimeFromVideo" class="fill-time-btn">
                从当前视频时间填充
              </button>
            </div>
          </div>

          <!-- 富文本工具栏 -->
          <div class="rich-text-toolbar">
            <button @click="formatText('bold')" class="tool-btn" title="加粗">
              <img src="@/assets/images/fa5-bold-fas.png" alt="加粗" class="tool-icon">
            </button>
            <button @click="formatText('italic')" class="tool-btn" title="斜体">
              <img src="@/assets/images/if-italic-alt.png" alt="斜体" class="tool-icon">
            </button>
            <button @click="formatText('link')" class="tool-btn" title="链接">
              <img src="@/assets/images/semiDesign-semi-icons-link.png" alt="链接" class="tool-icon">
            </button>
            <button @click="insertImage" class="tool-btn" title="插入图片">
              <img src="@/assets/images/riLine-image-line.png" alt="图片" class="tool-icon">
            </button>
            <button @click="insertFormula" class="tool-btn" title="插入公式">
              <img src="@/assets/images/iconPark-formula.png" alt="公式" class="tool-icon">
            </button>
            <button @click="openColorPicker" class="tool-btn" title="颜色">
              <img src="@/assets/images/md-palette.png" alt="颜色" class="tool-icon">
            </button>
          </div>

          <!-- 卡片标题输入 -->
          <div class="card-title-input">
            <label>卡片标题</label>
            <input type="text" v-model="cardTitle" placeholder="输入卡片标题" class="title-input" />
          </div>

          <!-- 卡片内容编辑 -->
          <div class="card-content-editor">
            <label>卡片内容</label>
            <textarea
              v-model="cardContent"
              rows="6"
              placeholder="输入卡片内容..."
              class="content-textarea"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="saveCurrentCard" class="modal-btn save-btn">保存卡片</button>
          <button @click="closeModal" class="modal-btn cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 定义卡片类型
interface Card {
  id?: string | number
  video_id?: number
  startTime: number
  endTime: number
  title: string
  summary: string
}

// 用户创建的卡片列表（初始为空，将在onMounted中尝试从数据库加载）
const userCards = ref<Card[]>([])

// 视频相关响应式状态
const videoElement = ref<HTMLVideoElement | null>(null)
const videoUrl = ref<string>('') // 视频URL，实际应用中应从路由参数或store中获取
const currentVideoTime = ref<number>(0)
const videoDuration = ref<number>(0)
const isPlaying = ref<boolean>(false)

// API相关配置和视频ID
const apiBaseUrl = ref('/api/admin')
const videoId = ref(1) // 默认视频ID，实际应用中应该从路由参数或store中获取

// 加载状态和错误信息
const isLoading = ref(false)
const errorMessage = ref('')
const showError = ref(false)

// 示例卡片数据
const exampleCards = ref<Card[]>([
  {
    startTime: 10,
    endTime: 25,
    title: '平行线的性质',
    summary: '平行线性质详解：\n\n1. 同位角相等：两条平行线被第三条直线所截，同位角相等。\n2. 内错角相等：两条平行线被第三条直线所截，内错角相等。\n3. 同旁内角互补：两条平行线被第三条直线所截，同旁内角之和为180度。',
  },
  {
    startTime: 40,
    endTime: 60,
    title: '牛顿第二定律',
    summary: '牛顿第二定律详解：\n\n核心公式：F = ma\n\n物理意义：\n1. 物体加速度与合外力成正比\n2. 加速度与物体质量成反比\n\n完整表达式：F = ma（F为合力，m为质量，a为加速度）\n\n应用说明：该定律描述了力、质量和加速度之间的关系，是经典力学的核心定律之一。',
  }
])

// 响应式状态
const selectedCardIndex = ref(-1)
const batchSelectedCards = ref<number[]>([])
const showCardModal = ref(false)
const cardStartTime = ref(0)
const cardEndTime = ref(0)
const cardTitle = ref('')
const cardContent = ref('')
const editingCardIndex = ref(-1)
const showExampleCards = ref(false)

// 时间格式相关状态
const timeFormatMode = ref<'seconds' | 'minutes' | 'hours'>('seconds') // 时间输入格式模式
const cardStartTimeDisplay = ref('0') // 显示给用户的开始时间
const cardEndTimeDisplay = ref('0') // 显示给用户的结束时间

// 时分秒分别输入
const startHours = ref(0)
const startMinutes = ref(0)
const startSeconds = ref(0)
const endHours = ref(0)
const endMinutes = ref(0)
const endSeconds = ref(0)

// 时间格式转换函数
// 将秒数转换为指定格式的时间字符串
const formatTimeForInput = (seconds: number, format: 'seconds' | 'minutes' | 'hours'): string => {
  switch (format) {
    case 'seconds':
      return seconds.toString()
    case 'minutes':
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    case 'hours':
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secondsRemain = Math.floor(seconds % 60)
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secondsRemain.toString().padStart(2, '0')}`
    default:
      return seconds.toString()
  }
}

// 将时间字符串解析为秒数（智能解析，支持多种格式）
const parseTimeToSeconds = (timeStr: string, format: 'seconds' | 'minutes' | 'hours'): number => {
  if (!timeStr.trim()) return 0
  
  // 移除所有空格
  const cleanStr = timeStr.replace(/\s/g, '')
  
  // 尝试根据冒号数量自动识别格式
  const colonCount = (cleanStr.match(/:/g) || []).length
  
  // 如果用户输入了冒号，优先使用冒号格式解析
  if (colonCount > 0) {
    const parts = cleanStr.split(':')
    
    if (colonCount === 2) {
      // 时:分:秒格式
      const hours = parseInt(parts[0] || '0') || 0
      const mins = parseInt(parts[1] || '0') || 0
      const secs = parseInt(parts[2] || '0') || 0
      return hours * 3600 + mins * 60 + secs
    } else if (colonCount === 1) {
      // 分:秒格式
      const mins = parseInt(parts[0] || '0') || 0
      const secs = parseInt(parts[1] || '0') || 0
      return mins * 60 + secs
    }
  }
  
  // 如果没有冒号，根据当前格式解析
  switch (format) {
    case 'seconds':
      return parseInt(cleanStr) || 0
    case 'minutes':
      // 如果输入纯数字且大于60，自动转换为分钟格式
      const num = parseInt(cleanStr) || 0
      if (num >= 60) {
        const mins = Math.floor(num / 60)
        const secs = num % 60
        return mins * 60 + secs
      }
      return num
    case 'hours':
      const numHours = parseInt(cleanStr) || 0
      if (numHours >= 3600) {
        const hours = Math.floor(numHours / 3600)
        const mins = Math.floor((numHours % 3600) / 60)
        const secs = numHours % 60
        return hours * 3600 + mins * 60 + secs
      } else if (numHours >= 60) {
        const mins = Math.floor(numHours / 60)
        const secs = numHours % 60
        return mins * 60 + secs
      }
      return numHours
    default:
      return parseInt(cleanStr) || 0
  }
}

// 根据视频时长自动选择合适的时间格式
const autoDetectTimeFormat = (duration: number): 'seconds' | 'minutes' | 'hours' => {
  if (duration >= 3600) {
    return 'hours'
  } else if (duration >= 60) {
    return 'minutes'
  } else {
    return 'seconds'
  }
}

// 计算属性
const isAllSelected = computed(() => {
  const currentCards = showExampleCards.value ? exampleCards.value : userCards.value
  return batchSelectedCards.value.length === currentCards.length && currentCards.length > 0
})

const selectedCardsCount = computed(() => {
  return batchSelectedCards.value.length
})

const timeDuration = computed(() => {
  return Math.max(0, cardEndTime.value - cardStartTime.value)
})

// 是否需要显示时的输入框（视频时长超过1小时）
const showHoursInput = computed(() => {
  return videoDuration.value >= 3600
})

// 是否需要显示分的输入框（视频时长超过1分钟）
const showMinutesInput = computed(() => {
  return videoDuration.value >= 60
})

// 视频时间格式化
const formattedVideoTime = computed(() => {
  return formatTime(currentVideoTime.value)
})

const formattedVideoDuration = computed(() => {
  return formatTime(videoDuration.value)
})

// 格式化时间为 MM:SS 格式
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 监听视频时长变化，自动调整时间格式
watch(videoDuration, (newDuration) => {
  if (newDuration > 0) {
    const newFormat = autoDetectTimeFormat(newDuration)
    if (newFormat !== timeFormatMode.value) {
      timeFormatMode.value = newFormat
      
      // 更新显示的时间格式
      cardStartTimeDisplay.value = formatTimeForInput(cardStartTime.value, newFormat)
      cardEndTimeDisplay.value = formatTimeForInput(cardEndTime.value, newFormat)
      
      console.log(`🕒 视频时长 ${newDuration}秒，自动切换到 ${newFormat} 格式`)
    }
  }
})

// 方法定义
const goBack = () => {
  // 使用数据库存储后，不需要在返回时自动保存
  // 保存操作已在每次编辑时执行
  router.push('/user')
}

// 时间输入处理函数
const handleStartTimeInput = () => {
  const seconds = parseTimeToSeconds(cardStartTimeDisplay.value, timeFormatMode.value)
  cardStartTime.value = seconds
}

const handleEndTimeInput = () => {
  const seconds = parseTimeToSeconds(cardEndTimeDisplay.value, timeFormatMode.value)
  cardEndTime.value = seconds
}

// 时分秒分别输入处理函数
const handleStartTimeChange = () => {
  // 计算总秒数
  const totalSeconds = startHours.value * 3600 + startMinutes.value * 60 + startSeconds.value
  cardStartTime.value = totalSeconds
}

const handleEndTimeChange = () => {
  // 计算总秒数
  const totalSeconds = endHours.value * 3600 + endMinutes.value * 60 + endSeconds.value
  cardEndTime.value = totalSeconds
}

// 格式化时长显示
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}时${minutes}分${secs}秒`
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`
  } else {
    return `${secs}秒`
  }
}

// 获取时间单位显示
const getTimeUnit = (): string => {
  switch (timeFormatMode.value) {
    case 'seconds': return '秒'
    case 'minutes': return '分:秒'
    case 'hours': return '时:分:秒'
    default: return '秒'
  }
}

// 获取时间输入框的占位符
const getTimePlaceholder = (): string => {
  switch (timeFormatMode.value) {
    case 'seconds': return '例如: 30'
    case 'minutes': return '例如: 1:30'
    case 'hours': return '例如: 1:05:30'
    default: return '例如: 30'
  }
}

// 获取时间格式显示名称
const getFormatDisplayName = (): string => {
  switch (timeFormatMode.value) {
    case 'seconds': return '秒数格式'
    case 'minutes': return '分:秒格式'
    case 'hours': return '时:分:秒格式'
    default: return '秒数格式'
  }
}

// 获取时间格式对应的CSS类名
const getFormatClass = (): string => {
  return timeFormatMode.value
}

const handleCardClick = (index: number) => {
  if (batchSelectedCards.value.length > 0) {
    toggleCardSelection(index)
  } else {
    selectCard(index)
  }
}

const selectCard = (index: number) => {
  if (index < 0 || index >= userCards.value.length) return
  selectedCardIndex.value = index
  batchSelectedCards.value = []
}

const toggleCardSelection = (index: number) => {
  if (index < 0 || index >= userCards.value.length) return
  
  if (batchSelectedCards.value.includes(index)) {
    batchSelectedCards.value = batchSelectedCards.value.filter(i => i !== index)
  } else {
    batchSelectedCards.value.push(index)
  }
  selectedCardIndex.value = -1
}

const selectAllCards = () => {
  const currentCards = showExampleCards.value ? exampleCards.value : userCards.value
  
  if (isAllSelected.value) {
    batchSelectedCards.value = []
  } else {
    batchSelectedCards.value = currentCards.map((_, index) => index)
  }
  selectedCardIndex.value = -1
}

const toggleExampleCards = () => {
  showExampleCards.value = !showExampleCards.value
  // 切换时清空选中状态
  selectedCardIndex.value = -1
  batchSelectedCards.value = []
}

// 编辑卡片功能
const editCard = (index: number) => {
  if (index < 0 || index >= userCards.value.length) return
  
  const card = userCards.value[index]
  if (!card) return
  
  cardStartTime.value = card.startTime
  cardEndTime.value = card.endTime
  cardTitle.value = card.title
  cardContent.value = card.summary
  editingCardIndex.value = index
  
  // 更新时分秒输入框
  updateTimeInputsFromSeconds(cardStartTime.value, cardEndTime.value)
  
  showCardModal.value = true
}

const addNewCard = () => {
  // 新增卡片时，默认使用当前视频时间作为开始时间
  if (videoElement.value && videoElement.value.currentTime > 0) {
    const currentTime = Math.floor(videoElement.value.currentTime)
    cardStartTime.value = currentTime
    cardEndTime.value = currentTime + 5 // 默认5秒时长
  } else {
    cardStartTime.value = 0
    cardEndTime.value = 0
  }
  
  cardTitle.value = ''
  cardContent.value = ''
  editingCardIndex.value = -1
  
  // 更新时分秒输入框
  updateTimeInputsFromSeconds(cardStartTime.value, cardEndTime.value)
  
  showCardModal.value = true
}

// 删除单个卡片功能
const deleteSingleCard = async (index: number) => {
  if (index < 0 || index >= userCards.value.length) return
  
  const card = userCards.value[index]
  if (!card) return
  
  if (confirm(`确定要删除"${card.title}"这张卡片吗？`)) {
    try {
      // 设置加载状态
      isLoading.value = true
      
      // ✅ 先从数据库删除
      if (card.id) {
        await deleteCardFromDatabase(card.id)
        console.log('已从数据库删除卡片:', card.id)
      }
      
      // ✅ 再从本地数组删除
      userCards.value.splice(index, 1)
      
      // 更新选中状态
      if (selectedCardIndex.value === index) {
        selectedCardIndex.value = -1
      }
      
      // 更新批量选择索引
      batchSelectedCards.value = batchSelectedCards.value
        .filter(i => i !== index)
        .map(i => i > index ? i - 1 : i)
      
      // 显示删除成功提示
      showErrorNotification(`已成功删除知识卡片"${card.title}"！`)
    } catch (error) {
      showErrorNotification('删除失败，请稍后重试')
      console.error('删除单个卡片时出错:', error)
    } finally {
      // 无论成功失败，都关闭加载状态
      isLoading.value = false
    }
  }
}

// 视频控制方法
const playPauseVideo = () => {
  if (!videoElement.value) return
  
  if (videoElement.value.paused) {
    videoElement.value.play().then(() => {
      isPlaying.value = true
    }).catch(error => {
      console.error('播放视频失败:', error)
    })
  } else {
    videoElement.value.pause()
    isPlaying.value = false
  }
}

const jumpToCardTime = () => {
  if (!videoElement.value || selectedCardIndex.value < 0) return
  
  const card = userCards.value[selectedCardIndex.value]
  if (card) {
    videoElement.value.currentTime = card.startTime
    // 跳转到时间后自动播放
    videoElement.value.play().then(() => {
      isPlaying.value = true
    }).catch(error => {
      console.error('跳转到卡片时间后播放失败:', error)
    })
  }
}

// 点击卡片时间跳转到视频对应位置
const jumpToCardTimeByIndex = (index: number) => {
  console.log('🔍 [调试] jumpToCardTimeByIndex 被调用:', { 
    index, 
    hasVideo: !!videoElement.value,
    cardsLength: userCards.value.length 
  })
  
  if (!videoElement.value) {
    console.error('❌ 视频元素不存在')
    return
  }
  
  if (index < 0 || index >= userCards.value.length) {
    console.error('❌ 索引越界:', { index, cardsLength: userCards.value.length })
    return
  }
  
  const card = userCards.value[index]
  if (!card) {
    console.error('❌ 找不到卡片:', index)
    return
  }
  
  console.log('✅ 开始跳转:', { 
    title: card.title, 
    startTime: card.startTime,
    currentTime: videoElement.value.currentTime 
  })
  
  // 跳转到卡片开始时间
  videoElement.value.currentTime = card.startTime
  console.log(`⏱️ 跳转到卡片"${card.title}"的时间: ${card.startTime}s`)
  
  // 跳转后自动播放
  videoElement.value.play().then(() => {
    isPlaying.value = true
    console.log('✅ 播放成功')
  }).catch(error => {
    console.error('❌ 跳转到卡片时间后播放失败:', error)
  })
  
  // 同时选中这个卡片
  selectedCardIndex.value = index
  console.log('✅ 卡片已选中:', index)
}

const updateVideoTime = () => {
  if (!videoElement.value) return
  currentVideoTime.value = videoElement.value.currentTime
  
  // 自动高亮当前时间段内的卡片
  highlightCurrentTimeCard()
}

// 高亮显示当前视频时间点对应的卡片
const highlightCurrentTimeCard = () => {
  if (!showExampleCards.value && userCards.value.length > 0) {
    const currentTime = currentVideoTime.value
    const currentCardIndex = userCards.value.findIndex(card => 
      currentTime >= card.startTime && currentTime <= card.endTime
    )
    
    // 如果找到了对应的卡片且当前没有批量选择
    if (currentCardIndex >= 0 && batchSelectedCards.value.length === 0) {
      selectedCardIndex.value = currentCardIndex
    }
  }
}

// 判断卡片是否正在播放
const isCardCurrentlyPlaying = (card: Card) => {
  return currentVideoTime.value >= card.startTime && currentVideoTime.value <= card.endTime
}

// 选中并跳转到卡片时间
const selectAndJumpToCard = (index: number) => {
  selectedCardIndex.value = index
  jumpToCardTimeByIndex(index)
}

const handleVideoLoaded = () => {
  if (!videoElement.value) return
  videoDuration.value = videoElement.value.duration
  console.log('视频加载完成，总时长:', videoDuration.value)
}

const handleVideoError = (event: Event) => {
  const target = event.target as HTMLVideoElement;
  
  console.error('=== 视频加载错误详细信息 ===')
  console.error('错误事件:', event)
  console.error('当前videoUrl.value:', videoUrl.value)
  console.error('视频元素src属性:', target.src)
  console.error('视频元素错误代码:', target.error?.code)
  console.error('视频元素错误信息:', target.error?.message)
  
  // 错误代码含义:
  // 1 = MEDIA_ERR_ABORTED - 用户中止下载
  // 2 = MEDIA_ERR_NETWORK - 网络错误
  // 3 = MEDIA_ERR_DECODE - 解码错误
  // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED - 不支持的媒体格式
  const errorMessages: Record<number, string> = {
    1: '用户中止了视频下载',
    2: '网络错误,无法加载视频',
    3: '视频解码错误,文件可能损坏',
    4: '不支持的视频格式或文件不存在'
  }
  
  const errorCode = target.error?.code || 0
  console.error('错误类型:', errorMessages[errorCode] || '未知错误')
  
  // 检查URL参数中是否有用户上传的视频
  const urlParams = new URLSearchParams(window.location.search);
  const videoUrlParam = urlParams.get('videoUrl');
  
  if (videoUrlParam) {
    // 如果是用户上传的视频,显示详细错误信息
    const errorMsg = `视频加载失败: ${errorMessages[errorCode] || '未知错误'}\n当前URL: ${videoUrl.value}\n请检查:\n1. 后端服务是否运行(http://localhost:3000)\n2. 视频文件是否存在\n3. 视频URL是否正确`;
    showErrorNotification(errorMsg, 5000)
    console.error('当前尝试加载的URL:', videoUrl.value)
  } else {
    // 如果是默认视频,尝试使用备选视频
    showErrorNotification(`默认视频加载失败: ${errorMessages[errorCode] || '未知错误'},2秒后尝试备选视频`)
    setTimeout(() => {
      console.log('尝试加载备选视频')
      videoUrl.value = 'https://www.w3schools.com/html/mov_bbb.mp4'
    }, 2000)
  }
}

// 从当前视频时间填充卡片时间段
const fillTimeFromVideo = () => {
  if (videoElement.value) {
    const currentTime = Math.floor(videoElement.value.currentTime)
    // 如果正在编辑现有卡片，可以选择只更新开始时间或结束时间
    // 这里为了简化，直接设置开始时间为当前时间，结束时间为当前时间+5秒
    cardStartTime.value = currentTime
    cardEndTime.value = currentTime + 5
    
    // 更新时分秒输入框
    updateTimeInputsFromSeconds(cardStartTime.value, cardEndTime.value)
    
    console.log('已从视频当前时间填充卡片时间段')
  } else {
    console.warn('视频元素未就绪，无法填充时间')
  }
}

// 根据秒数更新时分秒输入框
const updateTimeInputsFromSeconds = (startSecondsVal: number, endSecondsVal: number) => {
  // 更新开始时间
  startHours.value = Math.floor(startSecondsVal / 3600)
  startMinutes.value = Math.floor((startSecondsVal % 3600) / 60)
  startSeconds.value = Math.floor(startSecondsVal % 60)
  
  // 更新结束时间
  endHours.value = Math.floor(endSecondsVal / 3600)
  endMinutes.value = Math.floor((endSecondsVal % 3600) / 60)
  endSeconds.value = Math.floor(endSecondsVal % 60)
}

// 批量删除功能
const batchDeleteCards = async () => {
  if (batchSelectedCards.value.length === 0) {
    showErrorNotification('请先选择要删除的卡片')
    return
  }
  
  if (confirm(`确定要删除选中的 ${batchSelectedCards.value.length} 张卡片吗？`)) {
    try {
      // 设置加载状态
      isLoading.value = true
      
      // 从大到小排序删除
      const sortedIndexes = [...batchSelectedCards.value].sort((a, b) => b - a)
      
      // 先从数据库删除
      for (const index of sortedIndexes) {
        if (index >= 0 && index < userCards.value.length) {
          const card = userCards.value[index]
          if (card && card.id) {
            await deleteCardFromDatabase(card.id)
          }
        }
      }
      
      // 再从本地数组删除
      sortedIndexes.forEach(index => {
        if (index >= 0 && index < userCards.value.length) {
          userCards.value.splice(index, 1)
        }
      })
      
      batchSelectedCards.value = []
      console.log('批量删除知识卡片成功')
      
      // 显示删除成功提示
      showErrorNotification(`已成功删除 ${sortedIndexes.length} 张知识卡片！`)
    } catch (error) {
      showErrorNotification('删除失败，请稍后重试')
      console.error('批量删除卡片时出错:', error)
    } finally {
      // 无论成功失败，都关闭加载状态
      isLoading.value = false
    }
  }
}

const aiAnalyze = () => {
  console.log('AI分析视频内容')
}

// 富文本编辑方法
const formatText = (type: string) => {
  console.log('格式化文本:', type)
  // 后续实现富文本编辑逻辑
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

const saveCurrentCard = async () => {
  // 表单验证
  if (!cardTitle.value.trim() || !cardContent.value.trim()) {
    showErrorNotification('请填写卡片标题和内容')
    return
  }

  if (cardStartTime.value >= cardEndTime.value) {
    showErrorNotification('结束时间必须大于开始时间')
    return
  }

  // 确保安全访问，先获取卡片再访问id
    const existingCard = editingCardIndex.value >= 0 && editingCardIndex.value < userCards.value.length 
      ? userCards.value[editingCardIndex.value] 
      : undefined;
      
    const cardData: Card = {
      id: existingCard?.id,
      video_id: videoId.value,
      startTime: cardStartTime.value,
      endTime: cardEndTime.value,
      title: cardTitle.value,
      summary: cardContent.value,
    }

  try {
    const response = await saveCardToDatabase(cardData)
    if (response.status) {
      if (editingCardIndex.value >= 0) {
        userCards.value[editingCardIndex.value] = cardData
        // 编辑卡片后重新排序
        userCards.value.sort((a, b) => a.startTime - b.startTime)
      } else {
        // 更新本地卡片数据，添加从数据库返回的ID
        cardData.id = response.data.id || response.data.knowledgeCard.id
        userCards.value.push(cardData)
        // 新增卡片后按时间排序
        userCards.value.sort((a, b) => a.startTime - b.startTime)
      }
      
      console.log('知识卡片已保存到数据库并按时间排序')
      closeModal()
      
      // 显示保存成功提示
      showErrorNotification('知识卡片保存成功！', 2000)
    } else {
      showErrorNotification('保存失败: ' + (response.message || '未知错误'))
    }
  } catch (error) {
    showErrorNotification('保存失败，请稍后重试')
    console.error('保存卡片时出错:', error)
  }
}

const closeModal = () => {
  showCardModal.value = false
  editingCardIndex.value = -1
  cardTitle.value = ''
  cardContent.value = ''
  cardStartTime.value = 0
  cardEndTime.value = 0
}

// 显示错误提示
const showErrorNotification = (message: string, duration: number = 3000) => {
  errorMessage.value = message
  showError.value = true
  
  // 自动隐藏错误提示
  setTimeout(() => {
    showError.value = false
    errorMessage.value = ''
  }, duration)
}

// API请求工具函数
const fetchFromApi = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // 使用绝对路径，与UserPage.vue保持一致
    const url = `/api/admin${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API请求失败 (${endpoint}):`, error)
    // 提供更友好的错误信息
    const errorMsg = error instanceof Error 
      ? error.message 
      : '网络请求失败，请检查网络连接或稍后重试'
    showErrorNotification(errorMsg)
    throw error
  }
}

// 从数据库加载知识卡片
const loadCardsFromDatabase = async () => {
  try {
    // 设置加载状态
    isLoading.value = true
    
    console.log('═══════════════════════════════════════');
    console.log('📚 开始加载知识卡片');
    console.log('   当前videoId:', videoId.value);
    
    // 由于后端API不支持直接按video_id筛选，我们需要获取所有卡片然后在前端过滤
    // 实际项目中，应该修改后端API支持按video_id筛选
    const response = await fetchFromApi('/knowledge_cards')
    if (response.status) {
      const allCards = response.data.knowledgeCards || []
      console.log('   API返回总卡片数:', allCards.length);
      
      // 转换后端数据格式为前端格式，并按开始时间排序
      userCards.value = allCards
        .filter((card: any) => {
          const matches = card.video_id === videoId.value;
          console.log(`   卡片ID ${card.id}: video_id=${card.video_id}, 匹配=${matches}`);
          return matches;
        })
        .map((card: any) => ({
          id: card.id,
          video_id: card.video_id,
          startTime: card.start_time,
          endTime: card.end_time,
          title: card.title,
          summary: card.content,
        }))
        .sort((a: any, b: any) => {
          // 按开始时间升序排序（从早到晚）
          return a.startTime - b.startTime;
        })
      console.log('   ✅ 筛选后卡片数:', userCards.value.length);
      console.log('   📊 卡片已按时间顺序排序');
      console.log('═══════════════════════════════════════')
    } else {
      // 处理API返回的错误
      showErrorNotification('加载失败: ' + response.message || '未知错误')
    }
  } catch (error) {
    console.error('从数据库加载知识卡片时出错:', error)
    showErrorNotification('加载知识卡片失败，请刷新页面重试')
  } finally {
    // 无论成功失败，都关闭加载状态
    isLoading.value = false
  }
}

// 将前端卡片数据转换为后端格式
const convertToBackendFormat = (card: Card) => {
  return {
    video_id: videoId.value,
    start_time: card.startTime,
    end_time: card.endTime,
    title: card.title,
    content: card.summary,
    content_type: 'text',
    display_style: 'popup',
    is_ai_generated: false
  }
}

// 保存知识卡片到数据库
const saveCardToDatabase = async (card: Card) => {
  try {
    const backendCardData = convertToBackendFormat(card)
    
    if (card.id) {
      // 更新现有卡片
      const response = await fetchFromApi(`/knowledge_cards/${card.id}`, {
        method: 'PUT',
        body: JSON.stringify(backendCardData)
      })
      return response
    } else {
      // 创建新卡片
      const response = await fetchFromApi('/knowledge_cards', {
        method: 'POST',
        body: JSON.stringify(backendCardData)
      })
      return response
    }
  } catch (error) {
    console.error('保存知识卡片到数据库时出错:', error)
    throw error
  }
}

// 从数据库删除知识卡片
const deleteCardFromDatabase = async (cardId: string | number) => {
  try {
    const response = await fetchFromApi(`/knowledge_cards/${cardId}`, {
      method: 'DELETE'
    })
    return response
  } catch (error) {
    console.error('从数据库删除知识卡片时出错:', error)
    throw error
  }
}

onMounted(async () => {
  try {
    // ⚠️ 重要: 先从URL获取参数,再加载卡片
    // 从URL查询参数中获取视频URL和videoId
    const urlParams = new URLSearchParams(window.location.search);
    const videoUrlParam = urlParams.get('videoUrl');
    const videoIdParam = urlParams.get('videoId');
    
    console.log('=== EditPage 初始化 ===');
    console.log('URL中的视频参数:', videoUrlParam);
    console.log('URL中的videoId参数:', videoIdParam);
    
    // ✅ 先更新videoId,确保加载正确视频的卡片
    if (videoIdParam) {
      const parsedId = parseInt(videoIdParam);
      if (!isNaN(parsedId)) {
        videoId.value = parsedId;
        console.log('✅ 已更新videoId:', videoId.value);
      }
    }
    
    // ✅ 现在再加载知识卡片(使用正确的videoId)
    await loadCardsFromDatabase()
    
    if (userCards.value.length > 0) {
      selectedCardIndex.value = 0
    }
    
    console.log('当前videoId:', videoId.value);
    
    if (videoUrlParam) {
      // 如果URL参数中存在视频URL，则使用它
      const decodedUrl = decodeURIComponent(videoUrlParam);
      console.log('解码后的视频URL:', decodedUrl);
      videoUrl.value = decodedUrl;
      
      // 等待DOM更新后再添加视频事件监听
      await nextTick();
      
      const videoElement = document.querySelector('video');
      if (videoElement) {
        videoElement.onloadedmetadata = () => {
          console.log('视频元数据已加载:', videoElement.duration);
        };
        videoElement.onerror = (e) => {
          console.error('视频加载错误:', e);
          // 如果视频加载失败，尝试重新加载
          setTimeout(() => {
            videoElement.src = decodedUrl;
            videoElement.load();
          }, 2000);
        };
      }
    } else {
      // 否则使用默认视频URL
      console.log('未找到视频参数，使用默认视频');
      videoUrl.value = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';
    }
    
    // 监听选中卡片变化，自动跳转到卡片时间
    watch(() => selectedCardIndex.value, (newIndex) => {
      if (newIndex >= 0 && userCards.value[newIndex]) {
        // 选中卡片时，跳转到卡片的开始时间
        jumpToCardTime()
      }
    })
  } catch (error) {
    console.error('页面初始化时出错:', error)
  }
})
</script>

<style scoped>
.edit-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: #4682b4;
  color: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}



.main-content {
  flex: 1;
  display: flex;
  align-items: stretch;
  height: calc(100vh - 60px);
}

/* 左侧项目侧边栏 */
.project-sidebar {
  width: 220px;
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 20px;
  overflow-y: auto;
}

/* 主内容区域样式 */
.premium-main-content {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: calc(100vh - 160px);
  padding: 0;
  display: flex;
  align-items: stretch;
}

/* 项目侧边栏样式 */
.premium-main-content .project-sidebar {
  width: 220px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-right: 24px;
  padding: 20px;
}

.project-sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-item {
  padding: 20px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #00b42a;
  border: 1px solid #00b42a;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-item:hover {
  opacity: 0.9;
}

.project-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.project-title {
  font-weight: 600;
  font-size: 14px;
  color: white;
  text-align: center;
  line-height: 1.2;
}

/* 中间卡片编辑器 */
.card-editor-section {
  flex: 1;
  background: white;
  padding: 20px;
  overflow-y: auto;
  min-width: 0;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.editor-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.editor-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.editor-actions .action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.ai-analysis-btn {
  background: #006dda;
  color: white;
}

.add-card-btn {
  background: #00b42a;
  color: white;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.select-all-btn {
  background: #3abef9;
  color: white;
}

.batch-delete-btn {
  background: #ff4d4f;
  color: white;
  font-weight: 600;
}

.batch-delete-btn:disabled {
  background: #d9d9d9;
  color: #8c8c8c;
  cursor: not-allowed;
}

.card-list-container {
  margin-bottom: 24px;
}

.card-list-container h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-item.active {
  border-color: #1890ff;
  background: #f0f7ff;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.2);
}

.card-item.batch-selected {
  border-color: #ff4d4f;
  background: #fff2f0;
  box-shadow: 0 2px 6px rgba(255, 77, 79, 0.2);
}

.card-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-time {
  background: #1890ff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

/* 可点击的时间样式 */
.clickable-time {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.clickable-time:hover {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.4);
}

.clickable-time:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(24, 144, 255, 0.3);
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

.card-title {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  flex: 1;
  margin-left: 8px;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.single-card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.action-icon:hover {
  opacity: 1;
}

.selection-indicator {
  background: #52c41a;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* 总结类型选项卡 */
.summary-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn.active {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: #1890ff;
}

.tab-btn:hover {
  background: #e6f7ff;
}

/* 卡片内容 */
.card-content {
  min-height: 60px;
  padding: 0 16px 12px;
}

.summary-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 右侧视频预览 */
.video-preview-section {
  width: 450px;
  background: white;
  border-left: 1px solid #e8e8e8;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.video-preview-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.video-preview-container {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.video-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-loading-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.video-loading-placeholder p {
  color: #fff;
  font-size: 16px;
  margin: 0;
}

.video-time {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  pointer-events: none;
}

/* 知识卡片时间轴 */
.cards-timeline {
  margin-top: 20px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.timeline-count {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.timeline-track {
  position: relative;
  height: 32px;
  background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #dee2e6;
}

.timeline-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(to right, #1890ff, #40a9ff);
  opacity: 0.2;
  transition: width 0.1s linear;
  pointer-events: none;
  z-index: 1;
}

.timeline-card-marker {
  position: absolute;
  top: 2px;
  bottom: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 4px;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.timeline-card-marker:hover {
  transform: scaleY(1.2);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.5);
  z-index: 3;
}

.timeline-card-marker.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  transform: scaleY(1.3);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.6);
  z-index: 4;
}

.timeline-card-marker.current {
  background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scaleY(1.2);
    opacity: 1;
  }
  50% {
    transform: scaleY(1.4);
    opacity: 0.9;
  }
}

.marker-index {
  color: white;
  font-size: 10px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  display: none;
}

.timeline-card-marker:hover .marker-index {
  display: block;
}

.timeline-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
}

.scale-mark {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

/* 视频控制按钮组 */
.video-controls {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.control-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.control-btn:disabled {
  background: #d9d9d9;
  color: #8c8c8c;
  cursor: not-allowed;
}

.video-info {
  margin-left: auto;
  font-size: 14px;
  color: #666;
}

/* 模态弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn {
  background: #1890ff;
  color: white;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

/* 弹窗内表单样式 */
.time-setting,
.card-title-input,
.card-content-editor {
  margin-bottom: 20px;
}

.fill-time-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #52c41a;
  color: white;
  cursor: pointer;
  font-size: 14px;
  margin-top: 8px;
  align-self: flex-start;
  transition: background 0.2s;
}

.fill-time-btn:hover {
  background: #73d13d;
}

.time-setting label,
.card-title-input label,
.card-content-editor label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.time-range-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 时间格式指示器样式 */
.time-format-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.format-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.format-value {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.format-value.seconds {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.format-value.minutes {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.format-value.hours {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.format-hint {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

/* 新的时分秒输入样式 */
.time-input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-label {
  font-size: 14px;
  color: #333;
  min-width: 80px;
}

.time-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.time-unit {
  font-size: 14px;
  color: #666;
  min-width: 20px;
}

.time-duration {
  padding: 8px 12px;
  background: #f0f7ff;
  border-radius: 4px;
  font-size: 14px;
  color: #1890ff;
  font-weight: 500;
}

/* 富文本工具栏 */
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
}

.tool-btn:hover {
  background: #f0f0f0;
  border-color: #1890ff;
}

.tool-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.title-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .project-sidebar {
    width: 200px;
  }
  .video-preview-section {
    width: 320px;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  .project-sidebar,
  .video-preview-section {
    width: 100%;
    border-right: none;
    border-left: none;
  }
  
  .time-input-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .time-label {
    min-width: auto;
  }
}

/* 示例卡片相关样式 */
.example-cards-tip {
  padding: 12px 16px;
  background: #f0f7ff;
  border: 1px dashed #1890ff;
  border-radius: 6px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.example-cards-tip:hover {
  background: #e6f7ff;
  border-color: #40a9ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.tip-text {
  color: #1890ff;
  font-size: 14px;
  font-weight: 500;
}

.example-cards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  margin-bottom: 16px;
}

.example-title {
  color: #52c41a;
  font-size: 14px;
  font-weight: 600;
}

.close-example-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.close-example-btn:hover {
  background: #ff7875;
  transform: scale(1.05);
}

.example-card {
  border-left: 4px solid #52c41a;
  background: #f6ffed;
}

.example-badge {
  background: #52c41a;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
  /* 错误提示样式 */
  .error-notification {
    position: fixed;
    top: 80px;
    right: 20px;
    background-color: #dc3545;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1001;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* 加载遮罩样式 */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1001;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    color: white;
    margin-top: 10px;
    font-size: 16px;
  }

  /* ===== EditPage 现代UI样式 ===== */
  
  /* 玻璃态效果基础样式 */
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .glass-card:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  /* 顶部标题栏样式 */
  .premium-header {
    padding: 16px 24px;
    margin-bottom: 24px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .logo-section .app-title {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }
  
  .logo-section .subtitle {
    font-size: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 4px 0 0 0;
  }
  
  .header-logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .header-logo {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #4a90e2, #a855f7);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 18px;
  }
  
  .header-title-section h1 {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #4a90e2, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }
  
  .header-subtitle {
    font-size: 14px;
    color: #666;
    margin-top: 4px;
    font-weight: 500;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .premium-btn {
    background: linear-gradient(135deg, #4a90e2, #a855f7);
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3);
  }
  
  .premium-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
  }
  
  .premium-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  /* 主内容区域样式 */
  .premium-main-content {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    min-height: calc(100vh - 160px);
    padding: 0;
  }
  
  /* 项目侧边栏样式 */
  .project-sidebar {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    margin-right: 24px;
    padding: 20px;
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .sidebar-icon {
    width: 24px;
    height: 24px;
    color: #4a90e2;
  }
  
  .sidebar-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
  
  .empty-projects {
    text-align: center;
    padding: 40px 20px;
    color: #666;
  }
  
  .empty-icon {
    width: 64px;
    height: 64px;
    color: #ccc;
    margin-bottom: 16px;
  }
  
  .empty-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #999;
  }
  
  .empty-description {
    font-size: 14px;
    color: #999;
    line-height: 1.5;
  }
  
  /* 卡片编辑区域样式 */
  .card-editor-section {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .premium-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .editor-title-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .editor-icon {
    width: 24px;
    height: 24px;
    color: #4a90e2;
  }
  
  .editor-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
    background: linear-gradient(135deg, #4a90e2, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .premium-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .premium-action-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 10px 20px;
    color: #333;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  /* 移除通用hover效果，改为为每个按钮添加特定hover效果 */
  .premium-action-btn:hover {
    transform: translateY(-1px);
    transition: all 0.3s ease;
  }
  
  /* AI分析按钮hover效果 */
  .ai-analysis-btn:hover {
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }
  
  /* 新增卡按钮hover效果 */
  .add-card-btn:hover {
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }
  
  /* 全选按钮hover效果 */
  .select-all-btn:hover {
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
  }
  
  /* 批量删除按钮hover效果 */
  .batch-delete-btn:hover {
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }
  
  .premium-action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .ai-analysis-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
  }
  
  .add-card-btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
  }
  
  .select-all-btn {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border: none;
  }
  
  .batch-delete-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
  }
  
  .back-btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
  }
  
  .back-btn:hover {
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }
  
  .batch-actions {
    display: flex;
    gap: 8px;
  }
  
  /* 视频预览区域样式 */
  .video-preview-section {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    margin-left: 24px;
    padding: 20px;
  }
  
  .preview-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .preview-icon {
    width: 24px;
    height: 24px;
    color: #4a90e2;
  }
  
  .preview-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
  
  /* 响应式设计 */
  @media (max-width: 1200px) {
    .premium-header {
      padding: 16px 20px;
    }
    
    .header-title-section h1 {
      font-size: 24px;
    }
    
    .card-editor-section {
      padding: 20px;
    }
    
    .premium-editor-header {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }
    
    .premium-actions {
      flex-wrap: wrap;
    }
  }
  
  @media (max-width: 768px) {
    .premium-main-content {
      flex-direction: column;
      gap: 16px;
    }
    
    .project-sidebar,
    .video-preview-section {
      width: 100%;
      margin: 0 0 16px 0;
    }
    
    .premium-header {
      padding: 12px 16px;
      border-radius: 12px;
    }
    
    .header-title-section h1 {
      font-size: 20px;
    }
    
    .header-actions {
      flex-direction: column;
      gap: 8px;
    }
    
    .premium-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>