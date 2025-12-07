<template>
  <div class="markdown-editor-wrapper">
    <div class="editor-header">
      <h3 class="editor-title">Markdown 编辑器</h3>
      <div class="editor-controls">
        <button class="control-btn" title="全屏编辑" @click="toggleFullScreen">⛶</button>
        <button class="control-btn" title="清空内容" @click="clearContent">🗑️</button>
      </div>
    </div>
    <div ref="editorElement" class="markdown-editor"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
// @ts-ignore - Toast UI Editor 类型定义问题
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'

const props = defineProps<{
  modelValue: string
  height?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const editorElement = ref<HTMLDivElement>()
let editorInstance: Editor | null = null

onMounted(() => {
  if (!editorElement.value) return

  // 初始化编辑器
  editorInstance = new Editor({
    el: editorElement.value,
    height: props.height || '400px',
    initialEditType: 'markdown',
    previewStyle: 'vertical', // 垂直分屏预览
    placeholder: props.placeholder || '请输入 Markdown 内容...',
    initialValue: props.modelValue || '',
    usageStatistics: false,
    toolbarItems: [
      ['heading', 'bold', 'italic', 'strike'],
      ['hr', 'quote'],
      ['ul', 'ol', 'task'],
      ['table', 'link', 'image'],
      ['code', 'codeblock'],
      ['scrollSync'],
    ],
    hooks: {
      addImageBlobHook: async (blob: Blob, callback: (url: string, altText: string) => void) => {
        // 上传图片到服务器
        const formData = new FormData()
        formData.append('image', blob)

        try {
          // 使用 /api 前缀让 Vite 代理处理
          const response = await fetch('/api/admin/videos/upload-image', {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            const result = await response.json()
            console.log('图片上传成功:', result)
            
            // 后端返回格式: { status, message, data: { url, filename, ... } }
            if (result.status && result.data && result.data.url) {
              const imageUrl = result.data.url // /uploads/images/xxx.png
              const fileName = (blob as File).name || result.data.filename || 'image'
              console.log('插入图片URL:', imageUrl)
              callback(imageUrl, fileName)
            } else {
              console.error('图片上传响应格式错误:', result)
              alert('图片上传失败: 响应格式错误')
            }
          } else {
            console.error('图片上传失败:', response.status, response.statusText)
            const errorText = await response.text()
            console.error('错误详情:', errorText)
            alert(`图片上传失败: ${response.statusText}`)
          }
        } catch (error) {
          console.error('图片上传错误:', error)
          alert('图片上传错误,请检查网络连接')
        }
      }
    },
  })

  // 监听内容变化并清理 Windows 本地路径
  editorInstance.on('change', () => {
    if (editorInstance) {
      let markdown = editorInstance.getMarkdown()
      
      // 检测并移除 Windows 本地文件路径（如 C:\Users\...）
      const windowsPathRegex = /!\[([^\]]*)\]\(([A-Z]:\\[^)]+)\)/g
      if (windowsPathRegex.test(markdown)) {
        console.warn('检测到本地文件路径，请使用工具栏按钮上传图片，或者拖拽图片到编辑器')
        // 替换本地路径为提示文本
        markdown = markdown.replace(windowsPathRegex, '[图片加载失败: $1]')
        editorInstance.setMarkdown(markdown, false)
      }
      
      emit('update:modelValue', markdown)
      emit('change', markdown)
    }
  })

  // 手动处理拖拽上传图片（Toast UI Editor 的 addImageBlobHook 不处理拖拽）
  const editorEl = editorElement.value.querySelector('.toastui-editor-main')
  if (editorEl) {
    // 阻止默认的拖拽行为
    editorEl.addEventListener('drop', async (e: Event) => {
      const dragEvent = e as DragEvent
      const files = dragEvent.dataTransfer?.files
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          // 只处理图片文件
          if (file && file.type.startsWith('image/')) {
            e.preventDefault()
            e.stopPropagation()
            
            // 上传图片
            const formData = new FormData()
            formData.append('image', file)
            
            try {
              const response = await fetch('/api/admin/videos/upload-image', {
                method: 'POST',
                body: formData,
              })
              
              if (response.ok) {
                const result = await response.json()
                if (result.status && result.data && result.data.url) {
                  const imageUrl = result.data.url
                  const fileName = file.name
                  console.log('拖拽上传成功，插入图片URL:', imageUrl)
                  
                  // 在当前光标位置插入图片
                  if (editorInstance) {
                    editorInstance.insertText(`![${fileName}](${imageUrl})`)
                  }
                }
              } else {
                console.error('拖拽上传失败:', response.status)
                alert('图片上传失败')
              }
            } catch (error) {
              console.error('拖拽上传错误:', error)
              alert('图片上传错误')
            }
          }
        }
      }
    })
    
    // 阻止拖拽时的默认行为
    editorEl.addEventListener('dragover', (e: Event) => {
      const dragEvent = e as DragEvent
      const files = dragEvent.dataTransfer?.files
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file && file.type.startsWith('image/')) {
            dragEvent.preventDefault()
            dragEvent.stopPropagation()
            break
          }
        }
      }
    })
  }
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (editorInstance && newValue !== editorInstance.getMarkdown()) {
    editorInstance.setMarkdown(newValue || '', false)
  }
})

// 清理
onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.destroy()
    editorInstance = null
  }
})

// 全屏切换功能
const toggleFullScreen = () => {
  const wrapper = document.querySelector('.markdown-editor-wrapper') as HTMLElement;
  if (!wrapper) return;
  
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    wrapper.requestFullscreen();
  }
};

// 清空内容功能
const clearContent = () => {
  if (editorInstance) {
    editorInstance.setMarkdown('', false);
    emit('update:modelValue', '');
    emit('change', '');
  }
};

// 暴露方法给父组件使用
defineExpose({
  getMarkdown: () => editorInstance?.getMarkdown() || '',
  getHTML: () => editorInstance?.getHTML() || '',
  setMarkdown: (markdown: string) => editorInstance?.setMarkdown(markdown),
  insertText: (text: string) => editorInstance?.insertText(text),
  focus: () => editorInstance?.focus(),
  toggleFullScreen,
  clearContent,
})
</script>

<style scoped>
.markdown-editor-wrapper {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(31, 58, 82, 0.12);
  border: 1px solid rgba(212, 165, 116, 0.2);
  background: white;
}

.editor-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #1F3A52 0%, #4A9FB8 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.editor-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.markdown-editor {
  width: 100%;
  min-height: 400px;
}

.markdown-editor-wrapper :deep(.toastui-editor-defaultUI) {
  border: none;
}

.markdown-editor-wrapper :deep(.toastui-editor-toolbar) {
  background: linear-gradient(135deg, rgba(248, 247, 245, 0.8) 0%, rgba(212, 165, 116, 0.05) 100%);
  border-bottom: 1px solid rgba(212, 165, 116, 0.15);
  padding: 12px;
}

.markdown-editor-wrapper :deep(.toastui-editor-toolbar button) {
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #1F3A52;
}

.markdown-editor-wrapper :deep(.toastui-editor-toolbar button:hover) {
  background-color: #D4A574;
  color: white;
  transform: translateY(-2px);
}

.markdown-editor-wrapper :deep(.toastui-editor-main-container) {
  background-color: white;
}

.markdown-editor-wrapper :deep(.toastui-editor-md-container) {
  background: linear-gradient(to right, white, rgba(74, 159, 184, 0.02));
}

.markdown-editor-wrapper :deep(.toastui-editor-md-preview) {
  background: linear-gradient(to left, white, rgba(212, 165, 116, 0.02));
  padding: 20px;
}

.markdown-editor-wrapper :deep(.ProseMirror) {
  padding: 20px;
  font-size: 15px;
  line-height: 1.8;
}

/* Markdown 预览样式优化 */
.markdown-editor-wrapper :deep(.toastui-editor-md-preview h1),
.markdown-editor-wrapper :deep(.toastui-editor-md-preview h2),
.markdown-editor-wrapper :deep(.toastui-editor-md-preview h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

.markdown-editor-wrapper :deep(.toastui-editor-md-preview p) {
  margin-bottom: 16px;
}

.markdown-editor-wrapper :deep(.toastui-editor-md-preview img) {
  max-width: 100%;
  border-radius: 4px;
  margin: 16px 0;
}

.markdown-editor-wrapper :deep(.toastui-editor-md-preview code) {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-editor-wrapper :deep(.toastui-editor-md-preview pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
}

.markdown-editor-wrapper :deep(.toastui-editor-md-preview blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 16px;
  color: #6b7280;
  margin: 16px 0;
}

.markdown-editor-wrapper :deep(.toastui-editor-md-preview table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-editor-wrapper :deep(.toastui-editor-md-preview th),
.markdown-editor-wrapper :deep(.toastui-editor-md-preview td) {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  text-align: left;
}

.markdown-editor-wrapper :deep(.toastui-editor-md-preview th) {
  background-color: #f9fafb;
  font-weight: 600;
}
</style>
