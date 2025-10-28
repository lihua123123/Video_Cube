<template>
  <div class="video-editor">
    <!-- 视频操作区标题 -->
    <h2>视频魔方</h2>

    <!-- 视频URL输入区 -->
    <div class="input-section">
      <label>输入视频URL：</label>
      <div class="url-input-group">
        <input type="text" v-model="videoUrl" placeholder="请输入视频URL" class="url-input" />
        <button @click="loadVideo" class="load-btn">加载视频</button>
      </div>
    </div>

    <!-- 视频展示框 -->
    <div class="video-preview">
      <div v-if="!currentVideo" class="video-placeholder">
        <!-- 黑色视频占位框 -->
        <span>视频预览区域</span>
      </div>
      <video v-else :src="currentVideo" controls class="video-player"></video>

      <!-- 视频信息显示 -->
      <div class="video-info">
        <div>正在剪切中的视频: {{ currentTime }}/{{ duration }}</div>
        <div>无保存的视频: 0.00</div>
      </div>
    </div>

    <!-- 底部功能按钮 -->
    <div class="action-buttons">
      <button @click="saveProject" class="btn save-btn">保存项目</button>
      <button @click="exportVideo" class="btn export-btn">导出为可分享链接</button>
      <button @click="uploadVideo" class="btn upload-btn">上传视频</button>
    </div>

    <!-- 设置选项 -->
    <div class="settings">
      <div class="setting-item">
        <label>分辨率：</label>
        <select v-model="resolution">
          <option value="1080p">1080p</option>
          <option value="720p">720p</option>
          <option value="480p">480p</option>
        </select>
      </div>

      <div class="setting-item">
        <label>保存到的文件名：</label>
        <input type="text" v-model="fileName" placeholder="输入文件名" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'VideoEditor',
  data() {
    return {
      videoUrl: '', // 存储用户输入的视频URL
      currentVideo: null, // 当前加载的视频
      currentTime: '0.000', // 当前播放时间
      duration: '0.00', // 视频总时长
      resolution: '1080p', // 分辨率设置
      fileName: '', // 保存的文件名
    }
  },
  methods: {
    // 加载视频方法
    loadVideo() {
      if (this.videoUrl) {
        this.currentVideo = this.videoUrl
        // 这里实际开发中会添加视频验证逻辑
        console.log('加载视频:', this.videoUrl)
      } else {
        alert('请输入视频URL')
      }
    },

    // 保存项目方法
    saveProject() {
      console.log('保存项目')
      // 这里实际会调用保存API
    },

    // 导出视频方法
    exportVideo() {
      console.log('导出视频')
      // 这里实际会调用导出API
    },

    // 上传视频方法
    uploadVideo() {
      console.log('上传视频')
      // 这里实际会处理文件上传
    },
  },
}
</script>

<style scoped>
.video-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.input-section {
  margin: 20px 0;
}

.url-input-group {
  display: flex;
  margin-top: 10px;
}

.url-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
}

.load-btn {
  background: #1890ff;
  color: white;
  border: none;
  padding: 0 20px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.video-preview {
  flex: 1;
  background: #000;
  border-radius: 8px;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.video-placeholder {
  font-size: 18px;
  color: #666;
}

.video-player {
  width: 100%;
  height: 100%;
}

.video-info {
  padding: 10px;
  background: #333;
  width: 100%;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.save-btn {
  background: #52c41a;
}
.export-btn {
  background: #faad14;
}
.upload-btn {
  background: #1890ff;
}

.settings {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
}

.setting-item {
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.setting-item label {
  width: 120px;
  font-weight: bold;
}

.setting-item input,
.setting-item select {
  flex: 1;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
