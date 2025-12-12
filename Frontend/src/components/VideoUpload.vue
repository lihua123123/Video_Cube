<template>
  <div class="video-upload-container">
    <!-- 上传方式切换 -->
    <div class="upload-mode-switch">
      <button 
        :class="['mode-btn', { active: uploadMode === 'file' }]"
        @click="uploadMode = 'file'"
      >
        <svg class="mode-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        本地上传
      </button>
      <button 
        :class="['mode-btn', { active: uploadMode === 'url' }]"
        @click="uploadMode = 'url'"
      >
        <svg class="mode-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
        链接输入
      </button>
    </div>

    <!-- 文件上传模式 -->
    <transition name="fade" mode="out-in">
      <div v-if="uploadMode === 'file' " 
        class="drag-drop-area"
        :class="{ 
          dragging: isDragging,
          'has-file': hasFile()
        }"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
        @click="hasFile() ? null : triggerFileSelection"
        key="file-mode"
      >
        <!-- 已上传文件显示 -->
        <div v-if="hasFile()" class="file-info-content">
          <div class="file-icon-large">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          
          <!-- 上传进度缓冲圈 -->
          <div class="progress-container" v-if="uploadProgress > 0 || isProcessing">
            <div class="progress-wrapper">
              <!-- 光晕效果 -->
              <div class="progress-glow" :class="{ 'complete': isComplete }"></div>
              
              <svg class="progress-circle" width="60" height="60" viewBox="0 0 60 60">
                <!-- 背景圆 -->
                <circle 
                  class="progress-circle-bg" 
                  cx="30" 
                  cy="30" 
                  r="25" 
                  :class="{ 'complete': isComplete }"
                />
                <!-- 进度圆 -->
                <circle 
                  class="progress-circle-fill" 
                  cx="30" 
                  cy="30" 
                  r="25" 
                  :stroke-dasharray="157" 
                  :stroke-dashoffset="157 - (157 * uploadProgress) / 100" 
                  :class="{ 'processing': isProcessing, 'complete': isComplete }"
                />
                <!-- 移除对勾效果 -->
                <!-- 进度文字 -->
                <text 
                  class="progress-text" 
                  x="30" 
                  y="30" 
                  text-anchor="middle" 
                  dominant-baseline="middle"
                  :class="{ 'complete': isComplete }"
                >
                  {{ isProcessing ? '处理中' : isComplete ? '完成' : `${uploadProgress}%` }}
                </text>
              </svg>
            </div>
          </div>
          
          <div class="file-name">{{ fileName }}</div>
          <button class="remove-button" @click.stop="reset">移除文件</button>
        </div>
        
        <!-- 拖拽上传提示 -->
        <div v-else class="drag-drop-content">
          <div class="upload-icon-large">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
          <div class="upload-text">拖拽视频到此处</div>
          <div class="upload-hint">或点击选择文件</div>
        </div>
      </div>

      <!-- URL 输入模式 -->
      <div v-else class="url-input-area" key="url-mode">
        <div class="form-group">
          <label class="url-label">视频 URL</label>
          <div class="glowing-input-container">
            <!-- Glow effect -->
            <div 
              class="glow-overlay"
              :class="{ 'active': isUrlFocused }"
              :style="{
                background: `radial-gradient(circle 200px at ${cursorPosition + 48}px 50%, rgba(180, 255, 120, 0.15), transparent 70%)`
              }"
            ></div>
            <div class="input-wrapper">
              <!-- Spotlight glow overlay -->
              <div 
                class="spotlight-overlay"
                :class="{ 'active': isUrlFocused }"
                :style="{
                  background: `radial-gradient(circle 180px at ${cursorPosition + 48}px 50%, rgba(200, 255, 140, 0.12), transparent 60%)`
                }"
              ></div>
              <input 
                v-model="videoUrl"
                type="text"
                class="url-input"
                placeholder="输入视频 URL"
                @input="errorMessage = ''"
                @focus="handleUrlFocus"
                @blur="handleUrlBlur"
                @click="handleUrlClick"
                @keyup="handleUrlKeyUp"
                ref="urlInputRef"
              />
              <!-- Measurement span for cursor position -->
              <span 
                ref="measureRef"
                class="measure-span"
                aria-hidden="true"
              >
                {{ videoUrl.slice(0, cursorIndex) || '输入视频 URL' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="url-label">视频标题</label>
          <div class="glowing-input-container">
            <!-- Glow effect -->
            <div 
              class="glow-overlay"
              :class="{ 'active': isTitleFocused }"
              :style="{
                background: `radial-gradient(circle 200px at ${titleCursorPosition + 48}px 50%, rgba(180, 255, 120, 0.15), transparent 70%)`
              }"
            ></div>
            <div class="input-wrapper">
              <!-- Spotlight glow overlay -->
              <div 
                class="spotlight-overlay"
                :class="{ 'active': isTitleFocused }"
                :style="{
                  background: `radial-gradient(circle 180px at ${titleCursorPosition + 48}px 50%, rgba(200, 255, 140, 0.12), transparent 60%)`
                }"
              ></div>
              <input 
                v-model="videoTitle"
                type="text"
                class="url-input"
                placeholder="输入视频标题"
                @focus="handleTitleFocus"
                @blur="handleTitleBlur"
                @click="handleTitleClick"
                @keyup="handleTitleKeyUp"
                ref="titleInputRef"
              />
              <!-- Measurement span for cursor position -->
              <span 
                ref="titleMeasureRef"
                class="measure-span"
                aria-hidden="true"
              >
                {{ videoTitle.slice(0, titleCursorIndex) || '输入视频标题' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="url-label">视频描述</label>
          <div class="glowing-input-container">
            <!-- Glow effect -->
            <div 
              class="glow-overlay"
              :class="{ 'active': isDescFocused }"
              :style="{
                background: `radial-gradient(circle 200px at ${descCursorPosition + 48}px 50%, rgba(180, 255, 120, 0.15), transparent 70%)`
              }"
            ></div>
            <div class="input-wrapper">
              <!-- Spotlight glow overlay -->
              <div 
                class="spotlight-overlay"
                :class="{ 'active': isDescFocused }"
                :style="{
                  background: `radial-gradient(circle 180px at ${descCursorPosition + 48}px 50%, rgba(200, 255, 140, 0.12), transparent 60%)`
                }"
              ></div>
              <textarea 
                v-model="videoDescription"
                class="url-textarea"
                placeholder="输入视频描述"
                rows="3"
                @focus="handleDescFocus"
                @blur="handleDescBlur"
                @click="handleDescClick"
                @keyup="handleDescKeyUp"
                ref="descInputRef"
              ></textarea>
              <!-- Measurement span for cursor position -->
              <span 
                ref="descMeasureRef"
                class="measure-span"
                aria-hidden="true"
              >
                {{ videoDescription.slice(0, descCursorIndex) || '输入视频描述' }}
              </span>
            </div>
          </div>
        </div>

        <transition name="fade">
          <div v-if="errorMessage || successMessage">
            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
            <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import axios from 'axios'

// Props
interface Props {
  maxSize?: number // 最大文件大小（MB）
}

const props = withDefaults(defineProps<Props>(), {
  maxSize: 500 // 默认最大500MB
})

// Emits
const emit = defineEmits<{
  success: [videoData: any]
  progress: [percent: number]
  error: [error: string]
  fileSelected: [file: File]
}>()

// Refs
const uploadMode = ref<'file' | 'url'>('file') // 上传模式
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const fileName = ref('')
const uploadProgress = ref(0)
const errorMessage = ref('')
const successMessage = ref('')

// URL 模式相关
const videoUrl = ref('')
const videoTitle = ref('')
const videoDescription = ref('')

// Glowing input effect refs and state
// Video URL input
const urlInputRef = ref<HTMLInputElement>()
const measureRef = ref<HTMLSpanElement>()
const isUrlFocused = ref(false)
const cursorPosition = ref(0)
const cursorIndex = ref(0)

// Video Title input
const titleInputRef = ref<HTMLInputElement>()
const titleMeasureRef = ref<HTMLSpanElement>()
const isTitleFocused = ref(false)
const titleCursorPosition = ref(0)
const titleCursorIndex = ref(0)

// Video Description input
const descInputRef = ref<HTMLTextAreaElement>()
const descMeasureRef = ref<HTMLSpanElement>()
const isDescFocused = ref(false)
const descCursorPosition = ref(0)
const descCursorIndex = ref(0)

// Computed
const hasFile = () => selectedFile.value !== null

// 添加拖拽上传相关方法
const isDragging = ref(false)

const onDragOver = (event: DragEvent) => {
  isDragging.value = true
  event.dataTransfer!.dropEffect = 'copy'
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file) {
      // 检查文件类型
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
      if (!validTypes.includes(file.type)) {
        errorMessage.value = '请选择有效的视频文件（MP4, WebM, OGG, MOV）'
        return
      }
      // 检查文件大小
      const maxSizeBytes = props.maxSize * 1024 * 1024
      if (file.size > maxSizeBytes) {
        errorMessage.value = `文件大小超过限制（最大${props.maxSize}MB）`
        return
      }
      // 设置文件
      setVideoFile(file)
    }
  }
}

// 添加点击区域触发文件选择
const triggerFileSelection = () => {
  // 创建临时文件输入
  const tempInput = document.createElement('input')
  tempInput.type = 'file'
  tempInput.accept = 'video/mp4,video/webm,video/ogg,video/quicktime'
  tempInput.onchange = (event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      setVideoFile(input.files[0])
    }
  }
  tempInput.click()
}

// 上传视频 - 文件上传模式
const isProcessing = ref(false);
const isComplete = ref(false);

const uploadVideo = async (title?: string, description?: string) => {
  if (!selectedFile.value) {
    errorMessage.value = '请先通过编程方式设置视频文件'
    emit('error', errorMessage.value)
    throw new Error(errorMessage.value)
  }
  
  const formData = new FormData()
  formData.append('video', selectedFile.value)
  formData.append('title', title || selectedFile.value.name)
  formData.append('description', description || '')
  formData.append('transcode', 'true')
  
  try {
    uploadProgress.value = 0
    isProcessing.value = false
    
    // 使用XMLHttpRequest以便监听上传进度
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 90) // 只到90%，留10%给处理
          uploadProgress.value = percentComplete
          emit('progress', percentComplete)
        }
      })
      
      xhr.addEventListener('loadstart', () => {
        // 上传开始
      })
      
      xhr.addEventListener('loadend', () => {
        // 上传结束，开始处理
        isProcessing.value = true
      })
      
      xhr.addEventListener('load', () => {
        // 处理完成 - 避免状态突然变化导致缓冲圈异常
        // 先设置完成状态，再更新进度
        isComplete.value = true
        isProcessing.value = false
        uploadProgress.value = 100
        
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText)
          emit('success', response.data)
          resolve(response.data)
        } else {
          const error = JSON.parse(xhr.responseText)
          errorMessage.value = error.message || '上传失败'
          emit('error', errorMessage.value)
          reject(new Error(errorMessage.value))
        }
      })
      
      xhr.addEventListener('error', () => {
        errorMessage.value = '网络错误，上传失败'
        emit('error', errorMessage.value)
        isProcessing.value = false
        reject(new Error(errorMessage.value))
      })
      
      xhr.open('POST', '/api/admin/videos/upload')
      xhr.send(formData)
    })
  } catch (error) {
    errorMessage.value = '上传失败：' + (error instanceof Error ? error.message : String(error))
    emit('error', errorMessage.value)
    isProcessing.value = false
    throw error
  } finally {
        // 重置上传进度 - 完成状态下延迟更长时间让成功动画完整显示
        setTimeout(() => {
          if (!isProcessing.value && isComplete.value) {
            // 重置完成状态 - 延长完成状态显示时间，让用户清晰看到完成状态
            setTimeout(() => {
              isComplete.value = false
              // 延迟重置进度，避免突然消失
              setTimeout(() => {
                uploadProgress.value = 0
              }, 500)
            }, 2500) // 增加显示时间到2.5秒
          } else if (!isProcessing.value) {
            uploadProgress.value = 0
          }
        }, 1000)
      }
}

// 通过 URL 创建视频记录
const createVideoFromUrl = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  
  // 验证 URL
  if (!videoUrl.value.trim()) {
    errorMessage.value = '请输入视频 URL'
    emit('error', errorMessage.value)
    return
  }
  
  // 验证标题
  if (!videoTitle.value.trim()) {
    errorMessage.value = '请输入视频标题'
    emit('error', errorMessage.value)
    return
  }
  
  try {
    emit('progress', 50)
    
    const response = await axios.post('/api/admin/videos', {
      title: videoTitle.value.trim(),
      description: videoDescription.value.trim() || '',
      video_url: videoUrl.value.trim(),
      status: 'active',
      duration: 0 // URL 模式下默认时长为 0
    })
    
    if (response.data.status) {
      successMessage.value = '视频创建成功!'
      emit('success', response.data.data)
      emit('progress', 100)
      
      // 2秒后重置表单
      setTimeout(() => {
        resetUrlForm()
      }, 2000)
    } else {
      errorMessage.value = response.data.message || '创建视频失败'
      emit('error', errorMessage.value)
    }
  } catch (error: any) {
    errorMessage.value = '创建视频失败：' + (error.response?.data?.message || error.message)
    emit('error', errorMessage.value)
  } finally {
    setTimeout(() => {
      emit('progress', 0)
    }, 1000)
  }
}

// 重置 URL 表单
const resetUrlForm = () => {
  videoUrl.value = ''
  videoTitle.value = ''
  videoDescription.value = ''
  successMessage.value = ''
  errorMessage.value = ''
}

const reset = () => {
  selectedFile.value = null
  fileName.value = ''
  uploadProgress.value = 0
  errorMessage.value = ''
  successMessage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  resetUrlForm()
}

// 添加设置文件的方法，让父组件可以通过编程方式设置视频文件
const setVideoFile = (file: File) => {
  selectedFile.value = file
  fileName.value = file.name
  errorMessage.value = ''
  successMessage.value = ''
  emit('fileSelected', file)
}

// Glowing input effect methods
// Video URL input
const updateCursorPosition = () => {
  if (measureRef.value && urlInputRef.value) {
    const textBeforeCursor = videoUrl.value.slice(0, urlInputRef.value.selectionStart || 0)
    cursorIndex.value = urlInputRef.value.selectionStart || 0
    measureRef.value.textContent = textBeforeCursor || '输入视频 URL'
    const width = measureRef.value.offsetWidth
    cursorPosition.value = width
  }
}

const handleUrlFocus = () => {
  isUrlFocused.value = true
  updateCursorPosition()
}

const handleUrlBlur = () => {
  isUrlFocused.value = false
}

const handleUrlClick = () => {
  setTimeout(() => {
    updateCursorPosition()
  }, 0)
}

const handleUrlKeyUp = () => {
  updateCursorPosition()
}

// Video Title input
const updateTitleCursorPosition = () => {
  if (titleMeasureRef.value && titleInputRef.value) {
    const textBeforeCursor = videoTitle.value.slice(0, titleInputRef.value.selectionStart || 0)
    titleCursorIndex.value = titleInputRef.value.selectionStart || 0
    titleMeasureRef.value.textContent = textBeforeCursor || '输入视频标题'
    const width = titleMeasureRef.value.offsetWidth
    titleCursorPosition.value = width
  }
}

const handleTitleFocus = () => {
  isTitleFocused.value = true
  updateTitleCursorPosition()
}

const handleTitleBlur = () => {
  isTitleFocused.value = false
}

const handleTitleClick = () => {
  setTimeout(() => {
    updateTitleCursorPosition()
  }, 0)
}

const handleTitleKeyUp = () => {
  updateTitleCursorPosition()
}

// Video Description input
const updateDescCursorPosition = () => {
  if (descMeasureRef.value && descInputRef.value) {
    const textBeforeCursor = videoDescription.value.slice(0, descInputRef.value.selectionStart || 0)
    descCursorIndex.value = descInputRef.value.selectionStart || 0
    descMeasureRef.value.textContent = textBeforeCursor || '输入视频描述'
    const width = descMeasureRef.value.offsetWidth
    descCursorPosition.value = width
  }
}

const handleDescFocus = () => {
  isDescFocused.value = true
  updateDescCursorPosition()
}

const handleDescBlur = () => {
  isDescFocused.value = false
}

const handleDescClick = () => {
  setTimeout(() => {
    updateDescCursorPosition()
  }, 0)
}

const handleDescKeyUp = () => {
  updateDescCursorPosition()
}

// Watchers for input changes
// Watch for videoUrl changes to update cursor position
watch(videoUrl, () => {
  if (isUrlFocused.value) {
    updateCursorPosition()
  }
})

// Watch for videoTitle changes to update cursor position
watch(videoTitle, () => {
  if (isTitleFocused.value) {
    updateTitleCursorPosition()
  }
})

// Watch for videoDescription changes to update cursor position
watch(videoDescription, () => {
  if (isDescFocused.value) {
    updateDescCursorPosition()
  }
})

// 暴露方法给父组件
defineExpose({
  uploadVideo,
  createVideoFromUrl,
  reset,
  hasFile,
  setVideoFile,
  triggerFileSelection,
  uploadMode
})
</script>

<style scoped>
.video-upload-container {
  width: 100%;
}

/* 上传模式切换 */
.upload-mode-switch {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, rgba(31, 58, 82, 0.05) 0%, rgba(74, 159, 184, 0.05) 100%);
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(212, 165, 116, 0.15);
}

.mode-btn {
  flex: 1;
  padding: 14px 20px;
  border: 2px solid transparent;
  background: transparent;
  color: #8B8680;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.mode-icon {
  width: 20px;
  height: 20px;
}

.mode-btn:hover {
  background: rgba(74, 159, 184, 0.1);
  color: #4A9FB8;
}

.mode-btn.active {
  background: linear-gradient(135deg, #4A9FB8 0%, #1F3A52 100%);
  color: white;
  border-color: #D4A574;
  box-shadow: 0 8px 20px rgba(74, 159, 184, 0.3);
  transform: translateY(-2px);
}

/* 文件上传区域 */
.drag-drop-area {
  width: 100%;
  min-height: 160px;
  border: 2px dashed #4A9FB8;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(74, 159, 184, 0.08) 0%, rgba(212, 165, 116, 0.05) 100%);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
  position: relative;
  overflow: hidden;
}

.drag-drop-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 0%, rgba(212, 165, 116, 0.1), transparent 70%);
  pointer-events: none;
}

.drag-drop-area:hover {
  border-color: #D4A574;
  background: linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(74, 159, 184, 0.08) 100%);
  box-shadow: 0 8px 24px rgba(74, 159, 184, 0.2);
}

.drag-drop-area.dragging {
  border-color: #D4A574;
  background: linear-gradient(135deg, rgba(212, 165, 116, 0.25) 0%, rgba(74, 159, 184, 0.15) 100%);
  box-shadow: 0 12px 32px rgba(212, 165, 116, 0.3);
  transform: scale(1.02);
}

.drag-drop-area.has-file {
  border-color: #52c41a;
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(74, 159, 184, 0.08) 100%);
}

.upload-icon-large {
  font-size: 48px;
  color: #4A9FB8;
  margin-bottom: 12px;
  animation: float 3s ease-in-out infinite;
}

.upload-icon-large svg {
  width: 48px;
  height: 48px;
}

.drag-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.upload-text {
  color: #1F3A52;
  font-size: 16px;
  font-weight: 600;
}

.upload-hint {
  color: #8B8680;
  font-size: 13px;
}

.file-icon-large {
  font-size: 40px;
  margin-bottom: 12px;
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.file-icon-large svg {
  width: 40px;
  height: 40px;
  color: #52c41a;
}

.file-info-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.file-name {
  color: #1F3A52;
  font-size: 15px;
  font-weight: 600;
  word-break: break-all;
}

.remove-button {
  background: linear-gradient(135deg, #D4A574 0%, #C89564 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.2);
}

.remove-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 165, 116, 0.3);
}

/* URL 输入区域 */
.url-input-area {
  background: linear-gradient(135deg, rgba(31, 58, 82, 0.05) 0%, rgba(74, 159, 184, 0.05) 100%);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid rgba(212, 165, 116, 0.15);
  box-shadow: 0 4px 12px rgba(31, 58, 82, 0.08);
}

.form-group {
  margin-bottom: 24px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.url-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1F3A52;
}

/* Glowing input styles */
.glowing-input-container {
  position: relative;
  width: 100%;
}

.glow-overlay {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  transition: opacity 300ms ease;
  opacity: 0;
  pointer-events: none;
}

.glow-overlay.active {
  opacity: 100%;
}

.input-wrapper {
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(26, 35, 50, 0.3);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.spotlight-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: opacity 300ms ease;
  opacity: 0;
}

.spotlight-overlay.active {
  opacity: 100%;
}

.url-input {
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
  background: transparent;
  color: white;
  outline: none;
  position: relative;
  z-index: 2;
  caret-color: white;
}

.url-input:focus {
  color: white;
}

.url-input::placeholder {
  color: white;
}

.url-textarea {
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
  background: transparent;
  color: white;
  outline: none;
  min-height: 120px;
  position: relative;
  z-index: 2;
  caret-color: white;
}

.url-textarea:focus {
  color: white;
}

.url-textarea::placeholder {
  color: white;
}

/* Measurement span for cursor position */
.measure-span {
  position: absolute;
  left: 20px;
  top: 16px;
  font-size: 15px;
  font-weight: 500;
  opacity: 0;
  pointer-events: none;
  white-space: pre;
  color: transparent;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
}

.error-message {
  margin-top: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 10px;
  color: #C82333;
  font-size: 13px;
  animation: slideDown 0.3s ease;
}

.success-message {
  margin-top: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.05) 100%);
  border: 1px solid rgba(82, 196, 26, 0.3);
  border-radius: 10px;
  color: #52c41a;
  font-size: 13px;
  animation: slideDown 0.3s ease;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 上传进度缓冲圈样式 */
.progress-container {
  margin: 16px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  animation: fadeIn 0.6s ease-out;
}

.progress-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: scaleIn 0.4s ease-out 0.2s both;
}

.progress-glow {
  position: absolute;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(74, 159, 184, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
  opacity: 0.6;
  transition: background 0.3s ease;
}

.progress-glow.complete {
  background: radial-gradient(circle, rgba(76, 175, 80, 0.5) 0%, transparent 70%);
  animation: completePulse 0.8s ease-out 0.3s, glowFade 1s ease-out 1.5s forwards;
}

@keyframes glowFade {
  from {
    opacity: 0.6;
  }
  to {
    opacity: 0;
  }
}

.progress-circle {
  transform: rotate(-90deg); /* 将圆的起始点调整到顶部 */
  z-index: 1;
}

.progress-circle-bg {
  fill: none;
  stroke: rgba(74, 159, 184, 0.2);
  stroke-width: 4;
  transition: all 0.3s ease;
}

.progress-circle-bg.complete {
  stroke: rgba(76, 175, 80, 0.4);
  animation: completePulse 0.8s ease-out 0.3s;
}

.progress-circle-fill {
  fill: none;
  stroke: #4A9FB8;
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

/* 保持完成状态时进度圆不消失 */
.progress-circle-fill:not(.complete) {
  transition: stroke-dashoffset 0.3s ease, stroke 0.3s ease;
}

.progress-circle-fill.processing {
  stroke: #4A9FB8;
  animation: rotate 1.5s linear infinite, processingPulse 2s ease-in-out infinite;
}

.progress-circle-fill.complete {
  stroke: #4CAF50;
  animation: completeFill 0.6s ease-out forwards, completePulse 0.8s ease-out 0.3s;
  stroke-width: 4.5;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  fill: #2D2D2D;
  transform: rotate(90deg); /* 抵消svg的旋转 */
  transition: opacity 0.3s ease, transform 0.3s ease;
  animation: textAppear 0.5s ease-out 0.5s both;
}

.progress-text.complete {
  fill: white;
  font-weight: 700;
  animation: textScale 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes processingPulse {
  0%, 100% {
    stroke-opacity: 1;
    stroke-width: 4;
  }
  50% {
    stroke-opacity: 0.8;
    stroke-width: 5;
  }
}

/* 完成动画 */
@keyframes completeFill {
  0% {
    stroke-dashoffset: 157 - (157 * 90) / 100; /* 90% 位置开始 */
    stroke-width: 4;
  }
  70% {
    stroke-width: 5;
  }
  100% {
    stroke-dashoffset: 0;
    stroke-width: 4.5;
  }
}

/* 移除对勾相关样式 */

@keyframes completePulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
    opacity: 0.85;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes textScale {
  0% {
    transform: rotate(90deg) scale(0.9);
  }
  50% {
    transform: rotate(90deg) scale(1.2);
  }
  100% {
    transform: rotate(90deg) scale(1);
  }
}

@keyframes textAppear {
  from {
    opacity: 0;
    transform: rotate(90deg) scale(0.8);
  }
  to {
    opacity: 1;
    transform: rotate(90deg) scale(1);
  }
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  fill: #1F3A52;
  transform: rotate(90deg); /* 补偿SVG的旋转 */
}

@keyframes progress-animation {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>