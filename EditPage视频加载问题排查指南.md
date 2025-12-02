# 编辑页面视频加载失败排查指南

## 🐛 问题描述

在EditPage编辑卡片时出现视频加载失败:
```
视频加载失败: 不支持的视频格式或文件不存在
当前URL: [视频URL]
请检查:
1. 后端服务是否运行(http://localhost:3000)
2. 视频文件是否存在
3. 视频URL是否正确
```

## 🔍 问题排查步骤

### 步骤1: 检查浏览器控制台

打开浏览器控制台(F12 → Console),查看详细错误信息:

```javascript
=== 视频加载错误详细信息 ===
错误事件: [Event对象]
当前videoUrl.value: [视频URL]
视频元素src属性: [实际src]
视频元素错误代码: 4
错误类型: 不支持的视频格式或文件不存在
```

### 步骤2: 检查EditPage初始化

在控制台查看EditPage初始化日志:

```javascript
=== EditPage 初始化 ===
URL中的视频参数: http://localhost:3000/uploads/videos/xxx.mp4
URL中的videoId参数: 5
✅ 已更新videoId: 5
当前videoId: 5
```

**检查点**:
- ✅ 是否有 `videoUrl` 参数?
- ✅ 是否有 `videoId` 参数?
- ✅ URL格式是否正确?

### 步骤3: 检查后端服务

#### 3.1 确认后端是否运行

打开浏览器访问: `http://localhost:3000`

**预期结果**: 
- ✅ 看到网页内容或API响应
- ❌ 如果显示"无法访问此网站",说明后端未运行

**解决方案**:
```bash
cd Backend
npm start
# 或
node bin/www
```

#### 3.2 测试视频URL是否可访问

1. 从浏览器控制台复制视频URL
2. 在浏览器新标签页中直接打开该URL
3. 观察结果:
   - ✅ 视频开始播放 → URL正确,文件存在
   - ❌ 404错误 → 文件不存在
   - ❌ 无法连接 → 后端服务未运行

### 步骤4: 使用调试脚本

运行后端提供的调试脚本:

```bash
cd Backend
node debug_video_playback.js
```

**解读输出**:

```
测试1: 直接访问后端
URL: http://localhost:3000/uploads/videos/xxx.mp4
✅ 状态码: 200              ← 后端可访问
   Content-Type: video/mp4  ← 文件类型正确
   Content-Length: 1234567  ← 文件存在

测试2: 通过前端 /api 代理
URL: http://localhost:5173/api/uploads/videos/xxx.mp4
✅ 状态码: 200              ← 代理工作正常

测试3: 检查文件是否真实存在
文件路径: D:\Code\nodejs\Video_Cube\Backend\public\uploads\videos\xxx.mp4
✅ 文件存在
   大小: 1234567 字节 (1.18 MB)
```

## 🎯 常见问题及解决方案

### 问题1: 后端服务未运行

**症状**:
- 控制台显示"网络错误,无法加载视频"
- 访问 http://localhost:3000 显示"无法访问"

**解决方案**:
```bash
# Terminal 1: 启动后端
cd Backend
npm start

# Terminal 2: 启动前端(如果还没启动)
cd Frontend
npm run dev
```

### 问题2: 视频文件不存在

**症状**:
- 控制台显示"不支持的视频格式或文件不存在"
- 直接访问视频URL返回404

**原因**:
1. 视频从未上传
2. 视频文件被删除
3. 数据库中的路径不正确

**解决方案**:
1. 重新上传视频
2. 检查 `Backend/public/uploads/videos/` 目录
3. 检查数据库中 `videos` 表的 `video_url` 字段

### 问题3: 视频URL格式错误

**症状**:
- URL中有编码问题
- URL缺少 `/api` 前缀或端口号不对

**常见错误**:
```javascript
// ❌ 错误: 缺少 /api 前缀
videoUrl = 'http://localhost:3000/uploads/videos/xxx.mp4'
// 在前端应该使用:
videoUrl = '/api/uploads/videos/xxx.mp4'

// ❌ 错误: 使用了前端端口
videoUrl = 'http://localhost:5173/uploads/videos/xxx.mp4'
// 应该使用:
videoUrl = '/api/uploads/videos/xxx.mp4'  // 通过代理访问后端
```

**解决方案**:
检查UserPage跳转到EditPage时传递的URL格式:

```javascript
// 正确的做法
router.push({
  path: '/edit',
  query: {
    videoUrl: encodeURIComponent(video.video_url),  // 应该已经是正确格式
    videoId: video.id.toString()
  }
})
```

### 问题4: 跨域问题(CORS)

**症状**:
- 控制台显示 CORS 相关错误
- 视频请求被浏览器阻止

**解决方案**:

检查 `Frontend/vite.config.ts` 中的代理配置:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### 问题5: 视频格式不支持

**症状**:
- 控制台显示"视频解码错误"
- 文件存在但无法播放

**支持的格式**:
- ✅ MP4 (H.264编码)
- ✅ WebM
- ✅ OGG
- ❌ AVI (不支持)
- ❌ MKV (不支持)

**解决方案**:
使用工具转换视频格式为MP4:
```bash
# 使用 ffmpeg 转换
ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4
```

## 🛠️ 快速修复命令

### 重启所有服务

```bash
# 停止所有服务(Ctrl+C)

# Terminal 1: 重启后端
cd Backend
npm start

# Terminal 2: 重启前端
cd Frontend
npm run dev
```

### 检查视频文件

```bash
# 查看上传的视频文件
cd Backend/public/uploads/videos
dir  # Windows
ls -lh  # Linux/Mac
```

### 清理缓存并重启

```bash
# 清理前端缓存
cd Frontend
rm -rf node_modules/.vite
npm run dev

# 清理浏览器缓存
# 在浏览器中按 Ctrl+Shift+R 硬刷新
```

## 🔧 修复验证清单

完成修复后,按顺序验证:

- [ ] 后端服务运行正常 (http://localhost:3000)
- [ ] 前端服务运行正常 (http://localhost:5173)
- [ ] 直接访问视频URL能够播放
- [ ] UserPage能够正常播放视频
- [ ] 点击编辑按钮能跳转到EditPage
- [ ] EditPage能够正常加载视频
- [ ] EditPage显示正确的知识卡片
- [ ] 删除卡片后返回UserPage不再显示

## 📝 调试技巧

### 1. 在EditPage的onMounted中添加日志

如果问题持续,在浏览器控制台查看完整的初始化流程:

```
=== EditPage 初始化 ===
URL中的视频参数: [应该有值]
URL中的videoId参数: [应该有值]
✅ 已更新videoId: [数字]
当前videoId: [数字]

═══════════════════════════════════════
📚 开始加载知识卡片
   当前videoId: [数字]
   API返回总卡片数: [数字]
   ✅ 筛选后卡片数: [数字]
═══════════════════════════════════════
```

### 2. 手动测试视频URL

在浏览器控制台执行:

```javascript
// 获取当前视频URL
console.log('当前videoUrl:', window.location.search)

// 测试视频是否可访问
fetch('/api/uploads/videos/xxx.mp4', { method: 'HEAD' })
  .then(response => {
    console.log('状态码:', response.status)
    console.log('Content-Type:', response.headers.get('content-type'))
  })
  .catch(error => {
    console.error('错误:', error)
  })
```

### 3. 检查视频元素状态

```javascript
// 获取视频元素
const video = document.querySelector('video')
console.log('视频元素:', video)
console.log('当前src:', video.src)
console.log('readyState:', video.readyState)
console.log('error:', video.error)
```

## 💡 预防措施

### 1. 确保URL传递正确

在 `UserPage.vue` 中跳转到EditPage时:

```javascript
const editCard = (video: any) => {
  console.log('准备跳转到EditPage:', {
    videoUrl: video.video_url,
    videoId: video.id
  })
  
  router.push({
    path: '/edit',
    query: {
      videoUrl: encodeURIComponent(video.video_url),
      videoId: video.id.toString()
    }
  })
}
```

### 2. 视频上传后验证

上传视频后立即验证:

```javascript
const handleUploadSuccess = async (response: any) => {
  // ... 上传逻辑
  
  // 验证视频是否可访问
  const testUrl = `/api${videoUrl}`
  const testResponse = await fetch(testUrl, { method: 'HEAD' })
  if (!testResponse.ok) {
    console.error('视频上传成功但无法访问:', testUrl)
  }
}
```

### 3. 定期检查后端服务

添加心跳检测:

```javascript
// 每分钟检查一次后端服务
setInterval(async () => {
  try {
    const response = await fetch('/api/admin/videos', { method: 'HEAD' })
    if (!response.ok) {
      console.warn('后端服务响应异常')
    }
  } catch (error) {
    console.error('后端服务无法访问')
  }
}, 60000)
```

---

**创建时间**: 2025年11月24日  
**版本**: v1.0  
**状态**: ✅ 可用
