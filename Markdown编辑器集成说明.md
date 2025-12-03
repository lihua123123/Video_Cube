# Markdown 编辑器集成说明

## 更新时间
2025年12月3日

## 功能概述

成功在知识卡片编辑功能中集成了 **Toast UI Editor** Markdown 编辑器,提供专业的 Markdown 编辑体验。

## 主要特性

### 1. 双模式编辑器
- **Markdown 编辑器模式** (推荐):
  - 专业的 Markdown 语法编辑
  - 实时分屏预览(左侧编辑,右侧预览)
  - 语法高亮
  - 完整的工具栏支持
  - 图片拖拽上传
  
- **简单编辑器模式** (传统):
  - 保留原有的 textarea 编辑器
  - 富文本工具栏(加粗、斜体、链接等)
  - 适合快速输入

### 2. 工具栏功能
Markdown 编辑器提供以下工具栏按钮:
- **文本格式**: 标题、加粗、斜体、删除线
- **段落**: 分隔线、引用
- **列表**: 无序列表、有序列表、任务列表
- **插入**: 表格、链接、图片
- **代码**: 行内代码、代码块
- **其他**: 滚动同步

### 3. 图片上传支持
- 支持通过工具栏按钮上传图片
- 支持拖拽图片到编辑器
- 支持粘贴图片(Ctrl+V)
- 自动上传到后端 `/api/upload/image` 接口
- 返回完整的图片 URL

## 文件修改

### 新增文件
1. **Frontend/src/components/MarkdownEditor.vue**
   - 封装 Toast UI Editor 的 Vue 3 组件
   - 处理图片上传逻辑
   - 提供 v-model 双向绑定
   - 暴露编辑器方法给父组件

### 修改文件
1. **Frontend/src/views/EditPage.vue**
   - 添加编辑器模式切换功能
   - 集成 MarkdownEditor 组件
   - 保留原有简单编辑器功能
   - 添加模式切换按钮样式

2. **Frontend/package.json**
   - 新增依赖: `@toast-ui/editor`

## 使用方法

### 切换编辑器模式
在知识卡片编辑对话框顶部,点击以下按钮切换:
- 📝 **Markdown 编辑器**: 启用专业 Markdown 编辑
- ✏️ **简单编辑器**: 使用传统 textarea 编辑

### Markdown 语法示例

```markdown
# 一级标题
## 二级标题

**加粗文本** 和 *斜体文本*

- 列表项 1
- 列表项 2

[链接文字](https://example.com)

![图片描述](image-url)

`行内代码`

​```javascript
// 代码块
console.log('Hello World')
​```

> 引用文本

| 表头1 | 表头2 |
|------|------|
| 单元格1 | 单元格2 |
```

### 图片上传方式
1. **点击工具栏图片按钮**: 选择本地图片文件
2. **拖拽图片**: 直接拖拽图片到编辑区
3. **粘贴图片**: Ctrl+V 粘贴剪贴板中的图片

## 技术实现

### 核心依赖
- `@toast-ui/editor`: 3.2.2
- Toast UI Editor 官方 Markdown 编辑器库

### 组件架构
```
EditPage.vue (父组件)
  └─ MarkdownEditor.vue (子组件)
       └─ Toast UI Editor (第三方库)
```

### 图片上传流程
1. 用户上传/拖拽/粘贴图片
2. MarkdownEditor 组件拦截图片
3. 通过 FormData 发送到 `/api/upload/image`
4. 后端返回图片 URL
5. 插入 Markdown 图片语法 `![](url)`
6. 预览区实时显示图片

### 数据绑定
```vue
<!-- 父组件使用 -->
<MarkdownEditor 
  v-model="cardContent" 
  height="450px"
  placeholder="使用 Markdown 语法编辑..."
/>
```

## 样式优化

### 编辑器主题
- 工具栏背景: `#f9fafb`
- 编辑区背景: `#ffffff`
- 预览区背景: `#f9fafb`
- 边框圆角: `8px`
- 按钮悬停效果

### 预览样式
- 标题间距优化
- 代码块深色主题
- 引用左边框蓝色
- 表格边框灰色
- 图片圆角显示

## 暴露的方法

MarkdownEditor 组件通过 `defineExpose` 暴露以下方法:

```typescript
// 获取 Markdown 文本
const markdown = editorRef.value.getMarkdown()

// 获取 HTML
const html = editorRef.value.getHTML()

// 设置 Markdown 内容
editorRef.value.setMarkdown('# 新内容')

// 插入文本
editorRef.value.insertText('插入的文本')

// 聚焦编辑器
editorRef.value.focus()
```

## 兼容性说明

### 数据存储
- Markdown 内容直接存储在 `knowledge_cards.content` 字段
- 与原有存储格式完全兼容
- 图片 URL 已包含完整路径 (http://localhost:3000/uploads/images/xxx.png)

### 原有功能
- 所有原有的编辑功能保持不变
- 简单编辑器模式完全保留
- 不影响已有的知识卡片数据

## 注意事项

1. **后端图片接口**: 确保 `/api/upload/image` 接口正常运行
2. **CORS 设置**: 如果前后端分离,需要配置 CORS
3. **环境变量**: 确保 `.env.local` 中配置了 `VITE_API_BASE_URL`
4. **图片路径**: 上传的图片会自动转换为绝对路径

## 未来优化方向

1. **离线模式**: 支持图片先缓存,后上传
2. **图片压缩**: 上传前自动压缩大图片
3. **更多插件**: 集成数学公式、流程图等插件
4. **主题切换**: 提供明暗主题切换
5. **快捷键**: 自定义更多键盘快捷键
6. **协同编辑**: 多人实时协作编辑

## 测试清单

- [x] 基本文本编辑
- [x] Markdown 语法高亮
- [x] 实时预览
- [x] 模式切换
- [x] 图片上传
- [x] 工具栏功能
- [x] 数据保存
- [x] 双向绑定
- [ ] 图片拖拽上传 (需要实际测试)
- [ ] 图片粘贴上传 (需要实际测试)

## 相关资源

- [Toast UI Editor 官方文档](https://github.com/nhn/tui.editor)
- [Toast UI Editor API 文档](https://nhn.github.io/tui.editor/latest/)
- [Markdown 语法指南](https://www.markdownguide.org/)

## 问题排查

### 编辑器不显示
- 检查 `@toast-ui/editor` 是否正确安装
- 检查 CSS 是否正确导入
- 查看浏览器控制台错误信息

### 图片上传失败
- 检查后端接口 `/api/upload/image` 是否运行
- 检查网络请求状态码
- 验证 `VITE_API_BASE_URL` 配置

### 预览不同步
- 点击工具栏的"滚动同步"按钮
- 检查编辑器实例是否正确初始化

---

**开发者**: GitHub Copilot  
**项目**: Video Cube 知识卡片系统  
**版本**: 1.0.0
