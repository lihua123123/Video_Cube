# 🐛 loadVideo() 覆盖 videoId 问题修复

## 🔍 问题根源

### 日志分析

```
UserPage.vue:307 🔙 从 EditPage 返回,使用 videoId: 19
                 ↓ restoreVideoFromStorage(19) 被调用
                 ↓
UserPage.vue:392 🎬 loadVideo 被调用
                 ↓ loadVideo() 从 URL 提取数字
                 ↓
UserPage.vue:358 📂 已恢复保存的视频状态: {videoId: 2}  ← 被覆盖了!
                 ↓
UserPage.vue:814 📡 正在获取视频 2 的知识卡片...  ← 错误的 videoId!
```

### 问题代码

**文件**: `UserPage.vue` 第401-404行

```typescript
// ❌ 问题代码
const loadVideo = () => {
  // ...
  const urlParts = videoUrl.value.split('/')
  const lastPart = urlParts[urlParts.length - 1] || '0'
  const numericId = parseInt(lastPart)
  videoId.value = isNaN(numericId) ? 1 : numericId  // ❌ 覆盖了正确的 videoId!
}
```

### 执行流程

```
1. restoreVideoFromStorage(19) 开始执行
   ↓
2. videoId.value = 19  ✅ 设置为正确的值
   ↓
3. loadVideo() 被调用
   ↓
4. videoUrl.value = "/uploads/videos/2c5383df-8fd9-4367-8a3f-b6b96ed4622f.mp4"
   ↓
5. lastPart = "2c5383df-8fd9-4367-8a3f-b6b96ed4622f.mp4"
   ↓
6. parseInt("2c5383df-8fd9-4367-8a3f-b6b96ed4622f.mp4") = 2
   (因为字符串以 "2" 开头,parseInt 会提取前面的数字)
   ↓
7. videoId.value = 2  ❌ 覆盖了正确的 19!
```

### 为什么 parseInt 返回 2?

```javascript
parseInt("2c5383df-8fd9-4367-8a3f-b6b96ed4622f.mp4")
// JavaScript 的 parseInt 会从左到右解析,直到遇到非数字字符
// "2" → 提取成功,返回 2
// "c" → 遇到非数字,停止解析
// 结果: 2
```

## 🔧 修复方案

### 修复1: 移除 loadVideo() 中的 videoId 覆盖逻辑

**文件**: `UserPage.vue` 第395-408行

**修改前**:
```typescript
const loadVideo = () => {
  if (videoUrl.value.trim()) {
    isEncoding.value = true
    const fullUrl = videoUrl.value.startsWith('http') ? 
      videoUrl.value : 
      (videoUrl.value.startsWith('/api') ? videoUrl.value : `/api${videoUrl.value}`)
    
    currentVideo.value = fullUrl
    
    // ❌ 问题代码:从 URL 中猜测 videoId
    const urlParts = videoUrl.value.split('/')
    const lastPart = urlParts[urlParts.length - 1] || '0'
    const numericId = parseInt(lastPart)
    videoId.value = isNaN(numericId) ? 1 : numericId
    
    setTimeout(() => {
      isEncoding.value = false
    }, 2000)
  }
}
```

**修改后**:
```typescript
const loadVideo = () => {
  if (videoUrl.value.trim()) {
    isEncoding.value = true
    const fullUrl = videoUrl.value.startsWith('http') ? 
      videoUrl.value : 
      (videoUrl.value.startsWith('/api') ? videoUrl.value : `/api${videoUrl.value}`)
    
    currentVideo.value = fullUrl
    
    // ✅ 移除:不应该从URL中猜测 videoId,这会覆盖正确的 videoId
    // videoId 应该由以下方式正确设置:
    // 1. 从视频库选择视频时 (handleLibraryVideoPlay)
    // 2. 从 EditPage 返回时 (URL 参数)
    // 3. 从 localStorage 恢复时
    // 如果 videoId 未设置(例如直接输入URL),则保持为默认值 1
    
    console.log('   当前 videoId:', videoId.value)
    
    setTimeout(() => {
      isEncoding.value = false
    }, 2000)
  }
}
```

### 修复2: 增强 restoreVideoFromStorage 的调试日志

**文件**: `UserPage.vue` 第349-378行

**修改后**:
```typescript
const restoreVideoFromStorage = (overrideVideoId?: number) => {
  try {
    const savedState = localStorage.getItem('lastVideoState')
    if (savedState) {
      const videoState = JSON.parse(savedState)
      const savedTime = new Date(videoState.savedAt)
      const now = new Date()
      const timeDiff = now.getTime() - savedTime.getTime()
      const thirtyMinutes = 30 * 60 * 1000
      
      if (timeDiff < thirtyMinutes) {
        // ✅ 先设置所有状态,再调用 loadVideo()
        videoUrl.value = videoState.videoUrl
        videoId.value = overrideVideoId || videoState.videoId || 1
        uploadVideoDescription.value = videoState.videoDescription || ''
        uploadVideoTitle.value = videoState.videoName || '未命名视频'
        
        console.log('📂 准备恢复视频状态:', { 
          videoUrl: videoUrl.value, 
          videoId: videoId.value,
          来源: overrideVideoId ? 'URL参数(从EditPage返回)' : 'localStorage',
          overrideVideoId参数: overrideVideoId,
          localStorage中的videoId: videoState.videoId
        })
        
        // ✅ 加载视频 (loadVideo 现在不会修改 videoId)
        loadVideo()
        
        console.log('📂 已恢复保存的视频状态 (loadVideo后):', { 
          videoUrl: videoUrl.value, 
          videoId: videoId.value,
          来源: overrideVideoId ? 'URL参数(从EditPage返回)' : 'localStorage'
        })
        
        if (videoId.value) {
          fetchKnowledgeCards()
        }
      }
    }
  } catch (error) {
    console.error('恢复视频状态时出错:', error)
  }
}
```

## ✅ 修复效果

### 修复前
```
restoreVideoFromStorage(19)
  ↓ videoId.value = 19 ✅
  ↓ loadVideo()
     ↓ videoId.value = 2 ❌ 被覆盖!
  ↓ fetchKnowledgeCards() 使用 videoId=2 ❌ 错误!
```

### 修复后
```
restoreVideoFromStorage(19)
  ↓ videoId.value = 19 ✅
  ↓ loadVideo()
     ↓ 不修改 videoId ✅
  ↓ fetchKnowledgeCards() 使用 videoId=19 ✅ 正确!
```

## 🧪 测试步骤

### 测试1: 从 EditPage 返回

1. 刷新浏览器 (Ctrl+F5)
2. 在 UserPage 选择 videoId=19 的视频
3. 点击"编辑卡片"跳转到 EditPage
4. 点击"返回视频页面"
5. **检查控制台**:
   ```
   🔙 从 EditPage 返回,使用 videoId: 19
   📂 准备恢复视频状态: {videoId: 19, overrideVideoId参数: 19}
   🎬 loadVideo 被调用
      当前 videoId: 19  ← 确认没有被修改!
   📂 已恢复保存的视频状态 (loadVideo后): {videoId: 19}
   📡 正在获取视频 19 的知识卡片...  ← 正确!
   ```

### 测试2: 从视频库选择视频

1. 在 UserPage 的视频库中选择任意视频
2. **检查控制台**:
   ```
   videoId 已设置为: 19
   🎬 loadVideo 被调用
      当前 videoId: 19  ← 确认没有被修改!
   📡 正在获取视频 19 的知识卡片...
   ```

### 测试3: 刷新页面

1. 在 UserPage 播放一个视频
2. 刷新浏览器 (F5)
3. **检查控制台**:
   ```
   📂 准备恢复视频状态: {videoId: 19, localStorage中的videoId: 19}
   🎬 loadVideo 被调用
      当前 videoId: 19  ← 确认没有被修改!
   📂 已恢复保存的视频状态 (loadVideo后): {videoId: 19}
   📡 正在获取视频 19 的知识卡片...
   ```

## 🎯 关键改进

1. **移除不安全的 videoId 推断**:
   - 从 URL 中提取数字是不可靠的
   - UUID 格式的文件名会导致错误的 videoId
   - `parseInt("2c5383df...")` 返回 `2` 是 JavaScript 的正常行为

2. **明确 videoId 的来源**:
   - 从视频库选择: `handleLibraryVideoPlay` 设置
   - 从 EditPage 返回: URL 参数传递
   - 刷新页面: localStorage 恢复
   - 直接输入 URL: 保持默认值 1

3. **增强调试日志**:
   - 显示 `overrideVideoId` 参数值
   - 显示 localStorage 中的 videoId
   - 在 loadVideo 前后都输出 videoId
   - 清楚标识 videoId 的来源

## 📊 parseInt 行为说明

### 为什么 parseInt 会返回 2?

JavaScript 的 `parseInt()` 函数:
- 从左到右解析字符串
- 遇到第一个非数字字符时停止
- 返回已解析的数字部分

**示例**:
```javascript
parseInt("123abc")     // → 123
parseInt("2c5383df")   // → 2
parseInt("abc123")     // → NaN (没有找到数字)
parseInt("19.5")       // → 19 (只取整数部分)
```

**我们的情况**:
```javascript
const filename = "2c5383df-8fd9-4367-8a3f-b6b96ed4622f.mp4"
parseInt(filename)  // → 2
// 解析过程:
// "2" ← 是数字,继续
// "c" ← 不是数字,停止
// 返回: 2
```

## 🚨 潜在风险

### 如果用户直接在 videoUrl 输入框中输入视频 URL

**场景**:
- 用户在输入框中输入: `/uploads/videos/some-video.mp4`
- 点击"加载视频"按钮
- 此时 `videoId` 仍然是默认值 1

**解决方案**:
- 这是可以接受的行为
- 因为用户没有从视频库选择,我们无法知道正确的 videoId
- 知识卡片会加载 videoId=1 的卡片(如果有的话)
- 或者未来可以添加一个"从 URL 查询 videoId"的 API

### 向后兼容性

- ✅ 不影响从视频库选择视频
- ✅ 不影响 EditPage 跳转
- ✅ 不影响 localStorage 恢复
- ✅ 不影响分享链接功能

---

**修复时间**: 2025年11月24日  
**修复状态**: ✅ 已完成  
**需要测试**: 是  
**根本原因**: `loadVideo()` 从文件名猜测 videoId,导致覆盖正确的值
