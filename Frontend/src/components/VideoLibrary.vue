<template>
  <div class="video-library">
    <!-- 头部 -->
    <div class="library-header">
      <div class="header-title-section">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"/>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索视频..." 
            @input="debouncedSearch"
            class="search-input"
          />
        </div>
      </div>
      <div class="header-actions">
        <button @click="refreshList" class="refresh-btn" :disabled="loading">
          <svg :class="{ spinning: loading }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 6px; vertical-align: middle;">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 12a10 10 0 0120 0 10 10 0 01-20 0z"/>
          </svg> 刷新
        </button>
        <button 
          v-if="selectedVideos.length > 0" 
          @click="batchDelete" 
          class="batch-delete-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 6px; vertical-align: middle;">
            <path d="M3 6h18M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg> 批量删除 ({{ selectedVideos.length }})
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
      <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <!-- 时长标签 -->
          <div class="video-duration-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 4px;">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
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
          <div class="video-meta">
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 4px;">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ formatDate(video.created_at) }}
            </span>
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 4px;">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ formatDuration(video.duration) }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="video-actions">
          <button 
            @click.stop="playVideo(video)" 
            class="video-action-btn play-btn"
            title="播放视频"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
          <button 
            @click.stop="viewDetails(video)" 
            class="video-action-btn details-btn"
            title="查看详情"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="8"/>
            </svg>
          </button>
          <button 
            @click.stop="deleteVideo(video)" 
            class="video-action-btn delete-btn"
            title="删除视频"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 6h18M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
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
          <button @click="closeDetailsModal" class="close-btn" style="vertical-align: middle;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 8px;">
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 6px;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  选择图片
                </button>
                <button 
                  v-if="selectedThumbnailFile"
                  @click="uploadThumbnail" 
                  class="upload-btn"
                  :disabled="isUploadingThumbnail"
                >
                  <svg v-if="isUploadingThumbnail" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 6px; animation: spin 1s linear infinite;">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 12a10 10 0 0120 0 10 10 0 01-20 0z"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 6px;">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                    <path d="M2 2l7.586 7.586"/>
                    <circle cx="11" cy="11" r="2"/>
                  </svg>
                  {{ isUploadingThumbnail ? '上传中...' : '上传缩略图' }}
                </button>
                <button 
                  v-if="selectedThumbnailFile"
                  @click="cancelThumbnailSelect" 
                  class="cancel-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 6px;">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  取消
                </button>
              </div>
              
              <!-- 上传提示 -->
              <div class="upload-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle; margin-right: 6px;">
                  <path d="M9.4 18.6a2 2 0 0 0 3.2 0l10.2-10.2a2 2 0 0 0-3.2-3.2l-9 9a2 2 0 0 0-2.1 2.1c-.1.3 0 .7.3 1.1l1 1c.4.4.8.5 1.2.3z"/>
                  <path d="M7 14h1"/>
                  <path d="M7 10h1"/>
                  <path d="M7 12h2"/>
                </svg>
                支持 JPG、PNG、GIF、WebP 格式，建议大小不超过 2MB
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
    const params: { limit: number; offset: number; keyword?: string } = {
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
  } catch (err: unknown) {
    console.error('获取视频列表失败:', err);
    const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
    error.value = errorObj.response?.data?.message || errorObj.message || '网络错误';
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
  } catch (err: unknown) {
    console.error('上传缩略图失败:', err);
    const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
    alert('上传失败: ' + (errorObj.response?.data?.message || errorObj.message || '未知错误'));
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
  } catch (err: unknown) {
    console.error('删除视频失败:', err);
    const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
    alert('删除失败: ' + (errorObj.response?.data?.message || errorObj.message || '未知错误'));
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
  } catch (err: unknown) {
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
  background: linear-gradient(135deg, #f8f7f5 0%, #ffffff 100%);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(31, 58, 82, 0.08);
  padding: 28px;
}

/* 头部 */
.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  gap: 20px;
}

.header-title-section {
  flex: 1;
}

.library-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1F3A52;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid rgba(212, 165, 116, 0.2);
  border-radius: 12px;
  padding: 0 12px;
  transition: all 0.3s ease;
}

.search-box:hover {
  border-color: #4A9FB8;
  box-shadow: 0 4px 12px rgba(74, 159, 184, 0.15);
}

.search-box:focus-within {
  border-color: #4A9FB8;
  box-shadow: 0 0 0 3px rgba(74, 159, 184, 0.15);
}

.search-icon {
  width: 18px;
  height: 18px;
  color: #8B8680;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  border: none;
  outline: none;
  padding: 10px 0;
  width: 100%;
  font-size: 14px;
  background: transparent;
  color: #2D2D2D;
}

.search-input::placeholder {
  color: #8B8680;
}

.refresh-btn {
  background: linear-gradient(135deg, #1F3A52 0%, #4A9FB8 100%);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(74, 159, 184, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(74, 159, 184, 0.3);
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
  animation: spinSmooth 1.2s ease-in-out infinite;
}

@keyframes spinSmooth {
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

.loading-state {
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(74, 159, 184, 0.2);
  border-top-color: #4A9FB8;
  border-radius: 50%;
  animation: spinSmooth 1.2s ease-in-out infinite;
}

.loading-state p {
  color: #4A9FB8;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
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
  font-weight: 500;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

/* 视频列表 */
.video-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, white 0%, rgba(248, 247, 245, 0.8) 100%);
  border: 1px solid rgba(212, 165, 116, 0.2);
  border-radius: 14px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.video-item:hover {
  border-color: #4A9FB8;
  box-shadow: 0 8px 24px rgba(74, 159, 184, 0.15);
  transform: translateY(-2px);
}

.video-checkbox {
  flex-shrink: 0;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #4A9FB8;
}

.video-thumbnail {
  position: relative;
  width: 120px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(135deg, #1F3A52 0%, #4A9FB8 100%);
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.video-duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0);
  color: white;
  font-size: 32px;
  transition: all 0.3s ease;
}

.video-item:hover .play-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.video-info {
  flex: 1;
  min-width: 0;
}

.video-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1F3A52;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8B8680;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.video-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.video-action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(212, 165, 116, 0.2);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-action-btn:hover {
  border-color: #4A9FB8;
  background: rgba(74, 159, 184, 0.1);
  transform: translateY(-2px);
}

.delete-btn:hover {
  border-color: #D4A574;
  background: rgba(212, 165, 116, 0.1);
}

.btn-icon {
  font-size: 16px;
}

/* 分页控制 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(248, 247, 245, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(212, 165, 116, 0.15);
  margin-top: auto;
}

.page-btn {
  background: linear-gradient(135deg, rgba(31, 58, 82, 0.9) 0%, rgba(74, 159, 184, 0.8) 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(31, 58, 82, 0.15);
}

.page-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(74, 159, 184, 0.25);
  background: linear-gradient(135deg, rgba(31, 58, 82, 1) 0%, rgba(74, 159, 184, 0.9) 100%);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #8B8680;
  font-size: 13px;
  font-weight: 500;
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
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1F3A52;
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
  border-radius: 8px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f5f7fa;
  color: #303133;
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.detail-row {
  display: flex;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  width: 120px;
  font-weight: 600;
  color: #606266;
  flex-shrink: 0;
  font-size: 14px;
}

.detail-row span,
.detail-row a {
  flex: 1;
  color: #303133;
  word-break: break-all;
  font-size: 14px;
}

.detail-row a {
  color: #4A9FB8;
  text-decoration: none;
  transition: color 0.2s;
}

.detail-row a:hover {
  color: #1F3A52;
  text-decoration: underline;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  display: inline-block;
  font-weight: 600;
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
  padding: 16px 0;
}

.thumbnail-upload-section label {
  width: 100% !important;
  margin-bottom: 16px;
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
  border: 2px solid rgba(212, 165, 116, 0.2);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  position: relative;
  transition: all 0.3s;
}

.thumbnail-preview:hover,
.new-thumbnail-preview:hover {
  border-color: #4A9FB8;
  box-shadow: 0 4px 12px rgba(74, 159, 184, 0.15);
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
  padding: 6px 12px;
  font-size: 12px;
  text-align: center;
  font-weight: 600;
  border-radius: 0 0 8px 8px;
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
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.select-file-btn {
  background: linear-gradient(135deg, #4A9FB8 0%, #1F3A52 100%);
  color: white;
}

.select-file-btn:hover {
  background: linear-gradient(135deg, #1F3A52 0%, #4A9FB8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(74, 159, 184, 0.25);
}

.upload-btn {
  background: linear-gradient(135deg, #67c23a 0%, #529b2e 100%);
  color: white;
}

.upload-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #529b2e 0%, #67c23a 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.25);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-btn {
  background: linear-gradient(135deg, #f56c6c 0%, #e64949 100%);
  color: white;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #e64949 0%, #f56c6c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.25);
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;
  margin-top: 8px;
}

.hint-icon {
  font-size: 16px;
  color: #4A9FB8;
}
</style>
