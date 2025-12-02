# EditPage 知识卡片显示问题 - 修复报告

## 🔍 问题分析

### 问题现象
- **EditPage**: 加载视频 ID=33,找不到知识卡片 (⚠️ 没有找到知识卡片)
- **UserPage**: 加载视频 ID=1,找到 2 个知识卡片 (✅ 成功加载 2 个知识卡片)

### 关键日志对比

**EditPage**:
```
videoId: 33
API路径: /knowledge_cards?video_id=33
⚠️ 没有找到知识卡片
最终状态: {videoId: 33, 卡片数量: 0}
```

**UserPage**:
```
📡 正在获取视频 1 的知识卡片...
✅ 成功加载 2 个知识卡片
   📌 111: 0s - 5s
   📌 123: 1s - 3s
```

### 根本原因

**videoId 不一致问题**:

1. **UserPage → EditPage 跳转时**:
   - UserPage 正确传递了 `videoId: 33` 给 EditPage
   - EditPage 正确使用 `videoId: 33` 查询知识卡片
   - 但数据库中 `video_id=33` 的视频没有知识卡片

2. **EditPage → UserPage 返回时**:
   - UserPage 从 localStorage 恢复视频状态
   - **但 localStorage 中没有保存 `videoId`**
   - 默认使用 `videoId: 1`,而 `video_id=1` 有 2 个知识卡片
   - 所以 UserPage 显示了卡片,但这些卡片属于错误的视频!

### 数据流分析

```
UserPage (videoId=33)
    ↓ router.push({ query: { videoId: 33 } })
EditPage (videoId=33) ← 正确
    ↓ 查询 video_id=33
数据库 ← video_id=33 没有卡片 ❌
    
EditPage ← 用户点击返回
    ↓
UserPage 恢复 localStorage
    ↓ videoId 未保存
UserPage (videoId=1) ← 错误!应该是 33
    ↓ 查询 video_id=1
数据库 → video_id=1 有 2 个卡片 ✅
    ↓
显示了错误视频的卡片!
```

## 🔧 解决方案

### 修复1: 保存 videoId 到 localStorage

**文件**: `UserPage.vue` 第312-324行

**修改前**:
```typescript
const saveVideoToStorage = () => {
  const videoState = {
    videoUrl: videoUrl.value,
    videoName: uploadVideoTitle.value || '未命名视频',
    videoDescription: uploadVideoDescription.value,
    savedAt: new Date().toISOString()
  }
  localStorage.setItem('lastVideoState', JSON.stringify(videoState))
}
```

**修改后**:
```typescript
const saveVideoToStorage = () => {
  const videoState = {
    videoUrl: videoUrl.value,
    videoId: videoId.value,  // ✅ 新增: 保存 videoId
    videoName: uploadVideoTitle.value || '未命名视频',
    videoDescription: uploadVideoDescription.value,
    savedAt: new Date().toISOString()
  }
  localStorage.setItem('lastVideoState', JSON.stringify(videoState))
  console.log('💾 已保存视频状态:', { videoUrl: videoUrl.value, videoId: videoId.value })
}
```

### 修复2: 恢复 videoId 从 localStorage

**文件**: `UserPage.vue` 第327-353行

**修改前**:
```typescript
const restoreVideoFromStorage = () => {
  const videoState = JSON.parse(savedState)
  
  if (timeDiff < thirtyMinutes) {
    videoUrl.value = videoState.videoUrl
    uploadVideoDescription.value = videoState.videoDescription || ''
    uploadVideoTitle.value = videoState.videoName || '未命名视频'
    loadVideo()
    console.log('已恢复保存的视频状态')
  }
}
```

**修改后**:
```typescript
const restoreVideoFromStorage = () => {
  const videoState = JSON.parse(savedState)
  
  if (timeDiff < thirtyMinutes) {
    videoUrl.value = videoState.videoUrl
    videoId.value = videoState.videoId || 1  // ✅ 新增: 恢复 videoId
    uploadVideoDescription.value = videoState.videoDescription || ''
    uploadVideoTitle.value = videoState.videoName || '未命名视频'
    loadVideo()
    console.log('📂 已恢复保存的视频状态:', { videoUrl: videoUrl.value, videoId: videoId.value })
    
    // ✅ 新增: 恢复视频后,加载对应的知识卡片
    if (videoId.value) {
      fetchKnowledgeCards()
    }
  }
}
```

## ✅ 修复效果

### 修复前
```
UserPage (videoId=33) → EditPage (videoId=33, 0个卡片)
EditPage → UserPage (videoId=1, 2个卡片) ← 错误的视频!
```

### 修复后
```
UserPage (videoId=33) → EditPage (videoId=33, 0个卡片)
EditPage → UserPage (videoId=33, 0个卡片) ← 正确!
```

## 🧪 测试步骤

### 测试场景1: 有知识卡片的视频

1. 在 UserPage 选择有知识卡片的视频 (例如 videoId=1)
2. 点击"编辑卡片"跳转到 EditPage
3. **预期**: EditPage 显示该视频的知识卡片
4. 点击"返回视频页面"
5. **预期**: UserPage 显示相同视频的相同卡片

### 测试场景2: 没有知识卡片的视频

1. 在 UserPage 选择没有知识卡片的视频 (例如 videoId=33)
2. 点击"编辑卡片"跳转到 EditPage
3. **预期**: EditPage 显示"暂无知识卡片"
4. 点击"返回视频页面"
5. **预期**: UserPage 也显示该视频,没有知识卡片

### 验证日志

刷新页面后,检查控制台:

**从视频库选择视频**:
```
💾 已保存视频状态: {videoUrl: "...", videoId: 33}
```

**跳转到 EditPage**:
```
📚 EditPage - 开始加载知识卡片
   videoId: 33
```

**返回 UserPage**:
```
📂 已恢复保存的视频状态: {videoUrl: "...", videoId: 33}
📡 正在获取视频 33 的知识卡片...
```

## 📊 localStorage 数据结构

### 修复前
```json
{
  "videoUrl": "/uploads/videos/xxx.mp4",
  "videoName": "视频标题",
  "videoDescription": "描述",
  "savedAt": "2025-11-24T..."
}
```

### 修复后
```json
{
  "videoUrl": "/uploads/videos/xxx.mp4",
  "videoId": 33,  // ✅ 新增
  "videoName": "视频标题",
  "videoDescription": "描述",
  "savedAt": "2025-11-24T..."
}
```

## 🎯 关键改进

1. **完整的状态保存**: videoId 现在会被保存到 localStorage
2. **正确的状态恢复**: 返回 UserPage 时使用正确的 videoId
3. **自动加载卡片**: 恢复状态后自动调用 `fetchKnowledgeCards()`
4. **调试日志增强**: 保存和恢复时都输出详细日志

## 🚨 注意事项

### 对于 videoId=33 没有卡片的问题

这是**正常的**!如果数据库中 `video_id=33` 确实没有知识卡片,那么:
- ✅ EditPage 应该显示"没有找到知识卡片"
- ✅ UserPage 也应该没有知识卡片

如果你希望该视频有知识卡片,需要:
1. 在 EditPage 中创建新的知识卡片
2. 确保保存时 `video_id` 字段设置为 33
3. 或者在 UserPage 创建卡片后再跳转到 EditPage

## 🔍 如何验证修复成功

1. **清除 localStorage**: 
   ```javascript
   localStorage.removeItem('lastVideoState')
   ```

2. **选择有卡片的视频** (videoId=1):
   - UserPage 显示 2 个卡片 ✅
   - EditPage 显示 2 个卡片 ✅
   - 返回 UserPage 仍显示 2 个卡片 ✅

3. **切换到无卡片的视频** (videoId=33):
   - UserPage 显示 0 个卡片 ✅
   - EditPage 显示 0 个卡片 ✅
   - 返回 UserPage 仍显示 0 个卡片 ✅

4. **检查控制台日志**:
   - 保存时显示正确的 videoId
   - 恢复时显示正确的 videoId
   - 加载卡片时使用正确的 videoId

---

**修复时间**: 2025年11月24日  
**修复状态**: ✅ 已完成  
**需要测试**: 是
