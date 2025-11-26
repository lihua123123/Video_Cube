<template>
  <div class="video-library">
    <!-- 头部 -->
    <div class="library-header">
      <h2>视频库</h2>
      <div class="header-actions">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索视频标题..." 
            @input="debouncedSearch"
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>
        <button @click="refreshList" class="refresh-btn" :disabled="loading">
          <span :class="{ spinning: loading }">🔄</span> 刷新
        </button>
        <button 
          v-if="selectedVideos.length > 0" 
          @click="batchDelete" 
          class="batch-delete-btn"
        >
          <span class="btn-icon">🗑️</span> 批量删除 ({{ selectedVideos.length }})
        </button>
      </div>
    </div>
    
    <!-- 批量操作工具栏 -->
    <div v-if="videos.length > 0" class="batch-toolbar">
      <label class="checkbox-label">
        <input 
          type="checkbox" 
          :checked="isAllSelected"
          @change="toggleSelectAll"
          class="checkbox-input"
        />
        <span class="checkbox-text">全选</span>
      </label>
      <span v-if="selectedVideos.length > 0" class="selection-info">
        已选择 {{ selectedVideos.length }} 个视频
      </span>
      <button 
        v-if="selectedVideos.length > 0" 
        @click="clearSelection" 
        class="clear-btn"
      >
        清除选择
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && videos.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>❌ {{ error }}</p>
      <button @click="fetchVideos" class="retry-btn">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="videos.length === 0" class="empty-state">
      <div class="empty-icon">📹</div>
      <p>还没有上传任何视频</p>
      <p class="empty-hint">点击"上传视频"按钮开始上传</p>
    </div>

    <!-- 视频列表 -->
    <div v-else class="video-list">
      <div 
        v-for="video in videos" 
        :key="video.id" 
        class="video-item"
        @click="selectVideo(video)"
        :class="{ 
          selected: selectedVideo?.id === video.id,
          'checkbox-selected': isVideoSelected(video.id)
        }"
      >
        <!-- 复选框 -->
        <div class="video-checkbox" @click.stop="toggleVideoSelection(video.id)">
          <input 
            type="checkbox" 
            :checked="isVideoSelected(video.id)"
            class="checkbox-input"
          />
        </div>
        
        <!-- 缩略图 -->
        <div class="video-thumbnail">
          <img 
            v-if="video.thumbnail_url" 
            :src="getFullUrl(video.thumbnail_url)" 
            :alt="video.title"
            @error="handleImageError"
          />
          <div v-else class="thumbnail-placeholder">
            <span class="placeholder-icon">🎬</span>
          </div>
          <!-- 时长标签 -->
          <div class="video-duration-badge">
            <span class="duration-icon">⏱</span>
            {{ formatDuration(video.duration) }}
          </div>
          <!-- 播放按钮覆盖层 -->
          <div class="play-overlay">
            <div class="play-icon">▶</div>
          </div>
        </div>

        <!-- 视频信息 -->
        <div class="video-info">
          <h3 class="video-title" :title="video.title">{{ video.title }}</h3>
          <div class="video-meta-row">
            <span class="meta-date">
              <span class="meta-icon">📅</span>
              {{ formatDate(video.created_at) }}
            </span>
            <span class="meta-duration">
              <span class="meta-icon">⏱️</span>
              {{ formatDuration(video.duration) }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="video-actions">
          <button 
            @click.stop="playVideo(video)" 
            class="action-btn play-btn"
            title="播放视频"
          >
            <span class="btn-icon">▶️</span>
            <span class="btn-text">播放</span>
          </button>
          <button 
            @click.stop="viewDetails(video)" 
            class="action-btn details-btn"
            title="查看详情"
          >
            <span class="btn-icon">ℹ️</span>
          </button>
          <button 
            @click.stop="deleteVideo(video)" 
            class="action-btn delete-btn"
            title="删除视频"
          >
            <span class="btn-icon">🗑️</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 分页控制 -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="prevPage" 
        :disabled="currentPage === 1"
        class="page-btn"
      >
        ← 上一页
      </button>
      <span class="page-info">
        第 {{ currentPage }} / {{ totalPages }} 页 (共 {{ totalCount }} 个视频)
      </span>
      <button 
        @click="nextPage" 
        :disabled="currentPage >= totalPages"
        class="page-btn"
      >
        下一页 →
      </button>
    </div>

    <!-- 视频详情模态框 -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal-content details-modal">
        <div class="modal-header">
          <h3>视频详情</h3>
          <button @click="closeDetailsModal" class="close-btn">✕</button>
        </div>
        <div v-if="detailsVideo" class="modal-body">
          <div class="detail-row">
            <label>ID:</label>
            <span>{{ detailsVideo.id }}</span>
          </div>
          <div class="detail-row">
            <label>标题:</label>
            <span>{{ detailsVideo.title }}</span>
          </div>
          <div class="detail-row">
            <label>描述:</label>
            <span>{{ detailsVideo.description || '无' }}</span>
          </div>
          <div class="detail-row">
            <label>视频URL:</label>
            <a :href="getFullUrl(detailsVideo.video_url)" target="_blank">
              {{ detailsVideo.video_url }}
            </a>
          </div>
          <div class="detail-row">
            <label>缩略图URL:</label>
            <a v-if="detailsVideo.thumbnail_url" :href="getFullUrl(detailsVideo.thumbnail_url)" target="_blank">
              {{ detailsVideo.thumbnail_url }}
            </a>
            <span v-else>无</span>
          </div>
          
          <!-- 缩略图预览和上传 -->
          <div class="detail-row thumbnail-upload-section">
            <label>缩略图管理:</label>
            <div class="thumbnail-upload-content">
              <!-- 当前缩略图预览 -->
              <div class="thumbnail-preview">
                <img 
                  v-if="detailsVideo.thumbnail_url" 
                  :src="getFullUrl(detailsVideo.thumbnail_url)" 
                  alt="当前缩略图"
                  @error="handleImageError"
                />
                <div v-else class="no-thumbnail">
                  <span class="no-thumbnail-icon">🎬</span>
                  <span class="no-thumbnail-text">暂无缩略图</span>
                </div>
              </div>
              
              <!-- 新缩略图预览 -->
              <div v-if="selectedThumbnailFile" class="new-thumbnail-preview">
                <img :src="thumbnailPreviewUrl" alt="新缩略图预览" />
                <div class="preview-label">新缩略图预览</div>
              </div>
              
              <!-- 上传控制 -->
              <div class="upload-controls">
                <input 
                  ref="thumbnailInputRef"
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                  @change="handleThumbnailSelect"
                  style="display: none"
                />
                <button @click="triggerThumbnailSelect" class="select-file-btn">
                  <span class="btn-icon">📁</span>
                  选择图片
                </button>
                <button 
                  v-if="selectedThumbnailFile"
                  @click="uploadThumbnail" 
                  class="upload-btn"
                  :disabled="isUploadingThumbnail"
                >
                  <span class="btn-icon">{{ isUploadingThumbnail ? '⏳' : '⬆️' }}</span>
                  {{ isUploadingThumbnail ? '上传中...' : '上传缩略图' }}
                </button>
                <button 
                  v-if="selectedThumbnailFile"
                  @click="cancelThumbnailSelect" 
                  class="cancel-btn"
                >
                  <span class="btn-icon">✕</span>
                  取消
                </button>
              </div>
              
              <!-- 上传提示 -->
              <div class="upload-hint">
                <span class="hint-icon">💡</span>
                支持 JPG、PNG、GIF、WebP 格式,建议大小不超过 2MB
              </div>
            </div>
          </div>
          
          <div class="detail-row">
            <label>时长:</label>
            <span>{{ formatDuration(detailsVideo.duration) }}</span>
          </div>
          <div class="detail-row">
            <label>状态:</label>
            <span :class="['status-badge', detailsVideo.status]">
              {{ detailsVideo.status === 'active' ? '正常' : '处理中' }}
            </span>
          </div>
          <div class="detail-row">
            <label>创建时间:</label>
            <span>{{ formatFullDate(detailsVideo.created_at) }}</span>
          </div>
          <div class="detail-row">
            <label>更新时间:</label>
            <span>{{ formatFullDate(detailsVideo.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

interface Video {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  status: string;
  file_name?: string;
  thumbnail_name?: string;
  file_size?: number;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

// Props & Emits
const emit = defineEmits<{
  (e: 'play', video: Video): void;
  (e: 'select', video: Video): void;
}>();

// 状态
const videos = ref<Video[]>([]);
const loading = ref(false);
const error = ref('');
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(9); // 每页显示9个视频
const totalCount = ref(0);
const selectedVideos = ref<number[]>([]); // 选中的视频ID列表
const selectedVideo = ref<Video | null>(null);
const showDetailsModal = ref(false);
const detailsVideo = ref<Video | null>(null);

// 缩略图上传相关状态
const thumbnailInputRef = ref<HTMLInputElement | null>(null);
const selectedThumbnailFile = ref<File | null>(null);
const thumbnailPreviewUrl = ref('');
const isUploadingThumbnail = ref(false);

// 计算属性
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
const isAllSelected = computed(() => 
  videos.value.length > 0 && selectedVideos.value.length === videos.value.length
);

// 防抖搜索
let searchTimeout: number | null = null;
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    currentPage.value = 1;
    fetchVideos();
  }, 500);
};

// 获取视频列表
const fetchVideos = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const params: any = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    };
    
    if (searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim();
    }
    
    const response = await axios.get('/api/admin/videos', { params });
    
    if (response.data.status) {
      videos.value = response.data.data.videos || [];
      totalCount.value = response.data.data.total || videos.value.length;
      
      // 调试日志
      console.log('📹 视频列表加载成功!');
      console.log('总数:', totalCount.value);
      console.log('当前页视频数:', videos.value.length);
      if (videos.value.length > 0 && videos.value[0]) {
        const firstVideo = videos.value[0];
        console.log('第一个视频数据:', firstVideo);
        console.log('- ID:', firstVideo.id);
        console.log('- 标题:', firstVideo.title);
        console.log('- 缩略图URL:', firstVideo.thumbnail_url);
        console.log('- 完整缩略图URL:', getFullUrl(firstVideo.thumbnail_url));
        console.log('- 时长:', firstVideo.duration, '秒 ->', formatDuration(firstVideo.duration));
        console.log('- 创建时间:', firstVideo.created_at, '->', formatDate(firstVideo.created_at));
      }
    } else {
      error.value = response.data.message || '获取视频列表失败';
    }
  } catch (err: any) {
    console.error('获取视频列表失败:', err);
    error.value = err.response?.data?.message || err.message || '网络错误';
  } finally {
    loading.value = false;
  }
};

// 刷新列表
const refreshList = () => {
  fetchVideos();
};

// 分页控制
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchVideos();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchVideos();
  }
};

// 选择视频
const selectVideo = (video: Video) => {
  selectedVideo.value = video;
  emit('select', video);
};

// 播放视频
const playVideo = (video: Video) => {
  emit('play', video);
};

// 查看详情
const viewDetails = (video: Video) => {
  detailsVideo.value = video;
  showDetailsModal.value = true;
};

// 关闭详情模态框
const closeDetailsModal = () => {
  showDetailsModal.value = false;
  detailsVideo.value = null;
  // 清理缩略图上传状态
  cancelThumbnailSelect();
};

// 触发文件选择
const triggerThumbnailSelect = () => {
  thumbnailInputRef.value?.click();
};

// 处理缩略图文件选择
const handleThumbnailSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;
  
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('请选择有效的图片格式 (JPG, PNG, GIF, WebP)');
    return;
  }
  
  // 验证文件大小 (2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('图片大小不能超过 2MB,请选择更小的图片');
    return;
  }
  
  selectedThumbnailFile.value = file;
  
  // 生成预览URL
  const reader = new FileReader();
  reader.onload = (e) => {
    thumbnailPreviewUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
  
  console.log('📸 已选择缩略图:', file.name, '大小:', (file.size / 1024).toFixed(2), 'KB');
};

// 取消缩略图选择
const cancelThumbnailSelect = () => {
  selectedThumbnailFile.value = null;
  thumbnailPreviewUrl.value = '';
  if (thumbnailInputRef.value) {
    thumbnailInputRef.value.value = '';
  }
};

// 上传缩略图
const uploadThumbnail = async () => {
  if (!selectedThumbnailFile.value || !detailsVideo.value) return;
  
  isUploadingThumbnail.value = true;
  
  try {
    // 创建 FormData
    const formData = new FormData();
    formData.append('thumbnail', selectedThumbnailFile.value);
    
    console.log('🚀 开始上传缩略图:', {
      videoId: detailsVideo.value.id,
      fileName: selectedThumbnailFile.value.name,
      fileSize: selectedThumbnailFile.value.size
    });
    
    // 发送上传请求
    const response = await axios.post(
      `/api/admin/videos/${detailsVideo.value.id}/thumbnail`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    if (response.data.status) {
      alert('缩略图上传成功!');
      console.log('✅ 缩略图上传成功:', response.data);
      
      // 更新当前详情显示的缩略图
      if (detailsVideo.value && response.data.data?.thumbnail_url) {
        detailsVideo.value.thumbnail_url = response.data.data.thumbnail_url;
      }
      
      // 清理上传状态
      cancelThumbnailSelect();
      
      // 刷新视频列表
      await fetchVideos();
    } else {
      alert('上传失败: ' + response.data.message);
      console.error('❌ 上传失败:', response.data);
    }
  } catch (err: any) {
    console.error('❌ 上传缩略图失败:', err);
    alert('上传失败: ' + (err.response?.data?.message || err.message));
  } finally {
    isUploadingThumbnail.value = false;
  }
};

// 删除视频
const deleteVideo = async (video: Video) => {
  if (!confirm(`确定要删除视频"${video.title}"吗?`)) {
    return;
  }
  
  try {
    const response = await axios.delete(`/api/admin/videos/${video.id}`);
    if (response.data.status) {
      // 删除成功,刷新列表
      fetchVideos();
      if (selectedVideo.value?.id === video.id) {
        selectedVideo.value = null;
      }
      // 从选中列表中移除
      selectedVideos.value = selectedVideos.value.filter(id => id !== video.id);
      alert('删除成功!');
    } else {
      alert('删除失败: ' + response.data.message);
    }
  } catch (err: any) {
    console.error('删除视频失败:', err);
    alert('删除失败: ' + (err.response?.data?.message || err.message));
  }
};

// 批量操作相关函数
const toggleVideoSelection = (videoId: number) => {
  const index = selectedVideos.value.indexOf(videoId);
  if (index > -1) {
    selectedVideos.value.splice(index, 1);
  } else {
    selectedVideos.value.push(videoId);
  }
};

const isVideoSelected = (videoId: number) => {
  return selectedVideos.value.includes(videoId);
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedVideos.value = [];
  } else {
    selectedVideos.value = videos.value.map(v => v.id);
  }
};

const clearSelection = () => {
  selectedVideos.value = [];
};

const batchDelete = async () => {
  if (selectedVideos.value.length === 0) {
    alert('请先选择要删除的视频');
    return;
  }
  
  const count = selectedVideos.value.length;
  if (!confirm(`确定要删除选中的 ${count} 个视频吗?此操作不可恢复!`)) {
    return;
  }
  
  loading.value = true;
  let successCount = 0;
  let failCount = 0;
  
  try {
    // 逐个删除视频
    for (const videoId of selectedVideos.value) {
      try {
        const response = await axios.delete(`/api/admin/videos/${videoId}`);
        if (response.data.status) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`删除视频 ${videoId} 失败:`, err);
        failCount++;
      }
    }
    
    // 清空选中列表
    selectedVideos.value = [];
    
    // 刷新列表
    await fetchVideos();
    
    // 显示结果
    if (failCount === 0) {
      alert(`成功删除 ${successCount} 个视频!`);
    } else {
      alert(`删除完成!\n成功: ${successCount} 个\n失败: ${failCount} 个`);
    }
  } catch (err: any) {
    console.error('批量删除失败:', err);
    alert('批量删除过程中出现错误');
  } finally {
    loading.value = false;
  }
};

// 获取完整URL
const getFullUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `/api${url}`;
};

// 格式化时长
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

// 格式化日期(简短)
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
  if (days < 365) return `${Math.floor(days / 30)}月前`;
  return `${Math.floor(days / 365)}年前`;
};

// 格式化完整日期
const formatFullDate = (dateString: string) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 图片加载错误处理
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
};

// 组件挂载时加载数据
onMounted(() => {
  fetchVideos();
});

// 暴露方法供外部调用
defineExpose({
  fetchVideos,
  refreshList
});
</script>

<style scoped>
.video-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

/* 头部 */
.library-header {
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.library-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 8px 35px 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  width: 250px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
}

.refresh-btn {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.batch-delete-btn {
  padding: 8px 16px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  font-weight: 500;
}

.batch-delete-btn:hover {
  background: #f78989;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3);
}

/* 批量操作工具栏 */
.batch-toolbar {
  padding: 12px 20px;
  background: #f0f9ff;
  border-bottom: 1px solid #b3d8ff;
  display: flex;
  align-items: center;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #409eff;
}

.checkbox-text {
  font-size: 14px;
}

.selection-info {
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
}

.clear-btn {
  padding: 4px 12px;
  background: white;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #ecf5ff;
  color: #409eff;
  border-color: #409eff;
}

.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 加载/错误/空状态 */
.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-hint {
  color: #909399;
  font-size: 14px;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 视频列表 */
.video-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-content: start;
}

@media (max-width: 1400px) {
  .video-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .video-list {
    grid-template-columns: 1fr;
  }
}

.video-item {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
}

/* 复选框 */
.video-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.video-checkbox:hover {
  background: white;
  transform: scale(1.1);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
}

.video-checkbox .checkbox-input {
  pointer-events: none;
}

.video-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.video-item:hover .video-thumbnail img {
  transform: scale(1.05);
}

.video-item:hover .play-overlay {
  opacity: 1;
}

.video-item.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
}

.video-item.checkbox-selected {
  border-color: #67c23a;
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.2);
}

.video-item.checkbox-selected .video-checkbox {
  background: #67c23a;
}

.video-item.checkbox-selected .video-checkbox .checkbox-input {
  filter: brightness(0) invert(1);
}

/* 缩略图 */
.video-thumbnail {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 */
  background: #000;
  overflow: hidden;
}

.video-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.thumbnail-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.placeholder-icon {
  font-size: 64px;
  opacity: 0.9;
}

/* 时长标签 - 更突出的设计 */
.video-duration-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.duration-icon {
  font-size: 14px;
}

/* 播放覆盖层 */
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.play-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #409eff;
  padding-left: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.play-icon:hover {
  transform: scale(1.1);
}

/* 视频信息 */
.video-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

/* 元数据行 - 更紧凑突出的设计 */
.video-meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
}

.meta-date,
.meta-duration {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-weight: 500;
}

.meta-icon {
  font-size: 15px;
}

/* 操作按钮 */
.video-actions {
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
}

.action-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.play-btn {
  flex: 2;
  background: #409eff;
  color: white;
}

.play-btn:hover {
  background: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.details-btn,
.delete-btn {
  flex: 0;
  padding: 10px 12px;
  background: #f5f7fa;
  color: #606266;
}

.details-btn:hover {
  background: #ecf5ff;
  color: #409eff;
}

.delete-btn:hover {
  background: #fef0f0;
  color: #f56c6c;
}

.btn-icon {
  font-size: 16px;
}

.btn-text {
  font-weight: 600;
}

/* 分页 */
.pagination {
  padding: 20px;
  background: white;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.page-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #606266;
  font-size: 14px;
}

/* 详情模态框 */
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
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f5f7fa;
  color: #303133;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.detail-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  width: 120px;
  font-weight: 600;
  color: #606266;
  flex-shrink: 0;
}

.detail-row span,
.detail-row a {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.detail-row a {
  color: #409eff;
  text-decoration: none;
}

.detail-row a:hover {
  text-decoration: underline;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: inline-block;
}

.status-badge.active {
  background: #f0f9ff;
  color: #67c23a;
}

.status-badge.processing {
  background: #fdf6ec;
  color: #e6a23c;
}

/* 缩略图上传部分 */
.thumbnail-upload-section {
  flex-direction: column !important;
  align-items: flex-start !important;
}

.thumbnail-upload-section label {
  width: 100% !important;
  margin-bottom: 12px;
}

.thumbnail-upload-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.thumbnail-preview,
.new-thumbnail-preview {
  width: 240px;
  height: 135px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  position: relative;
}

.thumbnail-preview img,
.new-thumbnail-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-thumbnail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.no-thumbnail-icon {
  font-size: 48px;
  opacity: 0.5;
}

.no-thumbnail-text {
  font-size: 14px;
}

.new-thumbnail-preview {
  border-color: #67c23a;
  border-style: solid;
}

.preview-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(103, 194, 58, 0.9);
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  text-align: center;
  font-weight: 600;
}

.upload-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.select-file-btn,
.upload-btn,
.cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.select-file-btn {
  background: #409eff;
  color: white;
}

.select-file-btn:hover {
  background: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.upload-btn {
  background: #67c23a;
  color: white;
}

.upload-btn:hover:not(:disabled) {
  background: #85ce61;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-btn {
  background: #f56c6c;
  color: white;
}

.cancel-btn:hover {
  background: #f78989;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3);
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
}

.hint-icon {
  font-size: 16px;
}
</style>
