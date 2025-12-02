# URL 视频加载功能实现说明

## 📋 功能概述

在"上传视频"模态框中新增了通过 URL 创建视频记录的功能,用户现在可以选择:
1. **本地文件上传** - 上传本地视频文件
2. **URL 链接创建** - 通过输入视频 URL 创建视频记录

## ✨ 功能特点

### 1. 双模式切换
- **本地文件模式**: 拖拽或选择本地视频文件上传
- **URL 链接模式**: 输入视频 URL、标题、描述创建视频记录

### 2. URL 模式表单
用户需要填写:
- ✅ **视频 URL** (必填): 视频文件的网络地址
- ✅ **视频标题** (必填): 视频的标题
- ⭕ **视频描述** (可选): 视频的详细描述

### 3. 自动创建记录
- 提交后调用 `/api/admin/videos` POST 接口
- 创建视频数据库记录
- 自动加载到播放器

## 🎨 UI 设计

### 模式切换按钮
```
┌─────────────────────────────┐
│ [📁 本地文件] [🔗 URL 链接] │
└─────────────────────────────┘
```

- 灰色背景,激活状态为白色
- 平滑过渡动画
- 图标 + 文字标签

### URL 输入表单
```
┌────────────────────────────────┐
│ 视频 URL                       │
│ ┌────────────────────────────┐ │
│ │ http://example.com/vid.mp4 │ │
│ └────────────────────────────┘ │
│                                │
│ 视频标题                       │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ └────────────────────────────┘ │
│                                │
│ 视频描述 (可选)                │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │                            │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

- 清晰的标签
- 蓝色焦点边框
- 错误/成功消息提示

### 操作按钮
- **本地文件模式**: `[取消]` `[选择视频文件]` `[确认上传]`
- **URL 链接模式**: `[取消]` `[创建视频]`

## 🔧 技术实现

### 前端组件 (VideoUpload.vue)

#### 1. 模式切换
```typescript
const uploadMode = ref<'file' | 'url'>('file')
```

#### 2. URL 表单数据
```typescript
const videoUrl = ref('')
const videoTitle = ref('')
const videoDescription = ref('')
```

#### 3. 创建视频方法
```typescript
const createVideoFromUrl = async () => {
  // 验证输入
  if (!videoUrl.value.trim()) {
    errorMessage.value = '请输入视频 URL'
    return
  }
  if (!videoTitle.value.trim()) {
    errorMessage.value = '请输入视频标题'
    return
  }
  
  // 调用后端 API
  const response = await axios.post('/api/admin/videos', {
    title: videoTitle.value.trim(),
    description: videoDescription.value.trim() || '',
    video_url: videoUrl.value.trim(),
    status: 'active',
    duration: 0
  })
  
  // 触发成功事件
  emit('success', response.data.data)
}
```

### 后端 API (已存在)

**接口**: `POST /api/admin/videos`

**请求体**:
```json
{
  "title": "视频标题",
  "description": "视频描述",
  "video_url": "http://example.com/video.mp4",
  "status": "active",
  "duration": 0
}
```

**响应**:
```json
{
  "status": true,
  "message": "新建视频成功",
  "data": {
    "id": 123,
    "title": "视频标题",
    "video_url": "http://example.com/video.mp4",
    ...
  }
}
```

### 父组件集成 (UserPage.vue)

#### 1. 模态框按钮适配
```vue
<template v-if="videoUploadRef?.uploadMode === 'file'">
  <button @click="triggerFileSelection">选择视频文件</button>
  <button @click="confirmUpload">确认上传</button>
</template>
<template v-else>
  <button @click="confirmUrlUpload">创建视频</button>
</template>
```

#### 2. URL 创建方法
```typescript
const confirmUrlUpload = async () => {
  try {
    uploadStatus.value = '正在创建视频...'
    await videoUploadRef.value?.createVideoFromUrl()
  } catch (error) {
    console.error('创建视频失败:', error)
  }
}
```

#### 3. 统一的成功处理
```typescript
const handleUploadSuccess = (data: any) => {
  const videoData = data.video || data
  
  // 设置视频 URL
  if (videoData.video_url) {
    currentVideo.value = videoData.video_url
  }
  
  // 保存视频 ID
  if (videoData.id) {
    videoId.value = videoData.id
  }
  
  // 显示通知
  showNotification('视频创建成功！', 'success')
  
  // 关闭模态框
  closeUploadModal()
  
  // 加载知识卡片
  fetchKnowledgeCards()
}
```

## 💡 使用流程

### URL 模式创建视频

1. **打开上传模态框**
   - 点击"上传视频"按钮

2. **切换到 URL 模式**
   - 点击"🔗 URL 链接"标签

3. **填写表单**
   - 输入视频 URL (例如: `http://example.com/demo.mp4`)
   - 输入视频标题 (例如: `演示视频`)
   - 可选输入视频描述

4. **创建视频**
   - 点击"创建视频"按钮
   - 等待创建完成

5. **自动加载**
   - 视频记录创建成功
   - 自动加载到播放器
   - 显示成功通知
   - 可以查看关联的知识卡片

## 🎯 应用场景

### 1. 网络视频
```
URL: https://example.com/course/lesson-1.mp4
标题: 第一课:入门基础
描述: 本课介绍基础知识
```

### 2. CDN 视频
```
URL: https://cdn.example.com/videos/tutorial.mp4
标题: 完整教程
描述: 从入门到精通
```

### 3. 流媒体视频
```
URL: https://stream.example.com/live/session-123.mp4
标题: 直播回放
描述: 2025年11月24日直播
```

## ⚠️ 注意事项

### 1. URL 格式
- 必须是有效的视频 URL
- 建议使用绝对路径 (包含协议: http:// 或 https://)
- 支持常见视频格式 (.mp4, .webm, .ogg)

### 2. 视频可访问性
- 确保视频 URL 可以公开访问
- 检查跨域 (CORS) 设置
- 验证视频文件存在且未损坏

### 3. 数据完整性
- 标题必填,不能为空
- URL 必填,格式正确
- 描述可选

### 4. 时长信息
- URL 模式创建的视频,初始时长为 0
- 需要在播放时通过 `loadedmetadata` 事件获取实际时长
- 可以后续手动更新时长

## 📊 数据流

```
用户输入
  ↓
表单验证
  ↓
POST /api/admin/videos
  ↓
创建数据库记录
  ↓
返回视频数据
  ↓
emit('success', videoData)
  ↓
handleUploadSuccess()
  ↓
加载视频到播放器
  ↓
获取知识卡片
```

## 🔮 未来扩展

### 1. URL 验证
- 添加 URL 格式验证
- 检查视频可访问性
- 预览视频缩略图

### 2. 批量导入
- 支持多个 URL 批量导入
- CSV/JSON 文件导入
- 自动提取视频元数据

### 3. 智能填充
- 从 URL 自动提取标题
- 分析视频文件获取时长
- 自动生成缩略图

### 4. 历史记录
- 保存最近使用的 URL
- URL 快速选择
- 收藏常用视频源

## ✅ 测试清单

- [ ] 切换上传模式正常
- [ ] URL 输入框显示正确
- [ ] 标题输入框显示正确
- [ ] 描述输入框显示正确
- [ ] 必填项验证工作
- [ ] 创建视频 API 调用成功
- [ ] 视频加载到播放器
- [ ] 视频 ID 正确保存
- [ ] 知识卡片正常加载
- [ ] 错误提示正确显示
- [ ] 成功提示正确显示
- [ ] 模态框正确关闭
- [ ] 表单正确重置

---

**更新时间**: 2025年11月24日  
**版本**: v1.0  
**状态**: ✅ 已完成
