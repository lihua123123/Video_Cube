<template>
  <div class="video-upload-container">
    <!-- 上传方式切换 -->
    <div class="upload-mode-switch">
      <button 
        :class="['mode-btn', { active: uploadMode === 'file' }]"
        @click="uploadMode = 'file'"
      >
        📁 本地文件
      </button>
      <button 
        :class="['mode-btn', { active: uploadMode === 'url' }]"
        @click="uploadMode = 'url'"
      >
        🔗 URL 链接
      </button>
    </div>

    <!-- 文件上传模式 -->
    <div v-if="uploadMode === 'file'" 
      class="drag-drop-area"
      :class="{ 
        dragging: isDragging,
        'has-file': hasFile()
      }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="hasFile() ? null : triggerFileSelection"
    >
      <!-- 已上传文件显示 -->
      <div v-if="hasFile()" class="file-info-content">
        <div class="file-icon">📁</div>
        <div class="file-name">{{ fileName }}</div>
        <button class="remove-button" @click.stop="reset">移除文件</button>
      </div>
      
      <!-- 拖拽上传提示 -->
      <div v-else class="drag-drop-content">
        <div class="upload-icon">+</div>
        <div class="upload-text">拖拽视频文件到此处</div>
        <div class="upload-hint">或点击选择文件</div>
      </div>
    </div>

    <!-- URL 输入模式 -->
    <div v-else class="url-input-area">
      <div class="url-input-wrapper">
        <label class="url-label">视频 URL</label>
        <input 
          v-model="videoUrl"
          type="text"
          class="url-input"
          placeholder="输入视频 URL (例如: http://example.com/video.mp4)"
          @input="errorMessage = ''"
        />
      </div>
      
      <div class="url-input-wrapper">
        <label class="url-label">视频标题</label>
        <input 
          v-model="videoTitle"
          type="text"
          class="url-input"
          placeholder="输入视频标题"
        />
      </div>
      
      <div class="url-input-wrapper">
        <label class="url-label">视频描述 (可选)</label>
        <textarea 
          v-model="videoDescription"
          class="url-textarea"
          placeholder="输入视频描述"
          rows="3"
        ></textarea>
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
    
    // 使用XMLHttpRequest以便监听上传进度
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          uploadProgress.value = percentComplete
          emit('progress', percentComplete)
        }
      })
      
      xhr.addEventListener('load', () => {
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
        reject(new Error(errorMessage.value))
      })
      
      xhr.open('POST', '/api/admin/videos/upload')
      xhr.send(formData)
    })
  } catch (error) {
    errorMessage.value = '上传失败：' + (error instanceof Error ? error.message : String(error))
    emit('error', errorMessage.value)
    throw error
  } finally {
    // 重置上传进度
    setTimeout(() => {
      uploadProgress.value = 0
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
  margin-bottom: 20px;
  padding: 4px;
  background: #f0f0f0;
  border-radius: 8px;
}

.mode-btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-btn:hover {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.mode-btn.active {
  background: white;
  color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 文件上传区域 */
.drag-drop-area {
  width: 100%;
  min-height: 120px;
  border: 2px dashed #1890ff;
  border-radius: 8px;
  background-color: #f0f7ff;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.drag-drop-area:hover {
  border-color: #40a9ff;
  background-color: #e6f4ff;
}

.drag-drop-area.dragging {
  border-color: #52c41a;
  background-color: #f6ffed;
}

/* 已上传文件样式 */
.drag-drop-area.has-file {
  border-color: #52c41a;
  background-color: #f6ffed;
  cursor: default;
}

.drag-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 文件信息内容样式 */
.file-info-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  text-align: center;
}

.file-icon {
  font-size: 36px;
}

.file-name {
  color: #333;
  font-size: 16px;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 20px;
}

.remove-button {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.remove-button:hover {
  background-color: #ff7875;
}

.upload-icon {
  font-size: 32px;
  color: #1890ff;
  font-weight: bold;
}

.upload-text {
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

.upload-hint {
  color: #999;
  font-size: 12px;
}

/* URL 输入区域 */
.url-input-area {
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e0e0e0;
}

.url-input-wrapper {
  margin-bottom: 16px;
}

.url-input-wrapper:last-of-type {
  margin-bottom: 0;
}

.url-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.url-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.url-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.url-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s;
  box-sizing: border-box;
}

.url-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.error-message {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #ff4d4f;
  font-size: 14px;
}

.success-message {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  color: #52c41a;
  font-size: 14px;
}
</style>