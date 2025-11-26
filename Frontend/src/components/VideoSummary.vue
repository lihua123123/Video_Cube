<template>
  <div class="video-summary-container">
    <div class="summary-header">
      <h3 class="summary-title">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        视频总结
      </h3>
      <div class="summary-tabs">
        <button 
          v-for="level in summaryLevels" 
          :key="level.key"
          :class="['tab-button', { active: activeLevel === level.key }]"
          @click="activeLevel = level.key"
        >
          {{ level.label }}
        </button>
      </div>
    </div>

    <div class="summary-content">
      <transition name="fade" mode="out-in">
        <div :key="activeLevel" class="summary-section">
          <!-- 简单总结 -->
          <div v-if="activeLevel === 'simple'" class="summary-simple">
            <div class="summary-icon simple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div class="summary-text">
              <p v-if="summaries.simple">{{ summaries.simple }}</p>
              <p v-else class="empty-state">暂无简单总结，请点击"生成总结"按钮</p>
            </div>
          </div>

          <!-- 一般总结 -->
          <div v-else-if="activeLevel === 'normal'" class="summary-normal">
            <div class="summary-icon normal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div class="summary-text">
              <div v-if="summaries.normal">
                <h4>内容概述</h4>
                <p>{{ summaries.normal.overview }}</p>
                <h4>关键要点</h4>
                <ul>
                  <li v-for="(point, index) in summaries.normal.keyPoints" :key="index">
                    {{ point }}
                  </li>
                </ul>
              </div>
              <p v-else class="empty-state">暂无一般总结，请点击"生成总结"按钮</p>
            </div>
          </div>

          <!-- 详细总结 -->
          <div v-else-if="activeLevel === 'detailed'" class="summary-detailed">
            <div class="summary-icon detailed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </div>
            <div class="summary-text">
              <div v-if="summaries.detailed">
                <h4>完整描述</h4>
                <p>{{ summaries.detailed.fullDescription }}</p>
                
                <h4>章节内容</h4>
                <div v-for="(chapter, index) in summaries.detailed.chapters" :key="index" class="chapter-item">
                  <div class="chapter-header">
                    <span class="chapter-number">第 {{ index + 1 }} 部分</span>
                    <span class="chapter-time">{{ formatTime(chapter.startTime) }} - {{ formatTime(chapter.endTime) }}</span>
                  </div>
                  <p class="chapter-content">{{ chapter.content }}</p>
                </div>

                <h4>总结与见解</h4>
                <p>{{ summaries.detailed.conclusion }}</p>
              </div>
              <p v-else class="empty-state">暂无详细总结，请点击"生成总结"按钮</p>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <div class="summary-actions">
      <button 
        class="action-button generate"
        :disabled="isGenerating"
        @click="generateSummary"
      >
        <svg v-if="!isGenerating" class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <svg v-else class="button-icon spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        {{ isGenerating ? '生成中...' : '生成总结' }}
      </button>
      
      <button 
        class="action-button export"
        :disabled="!hasSummary"
        @click="exportSummary"
      >
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        导出总结
      </button>

      <button 
        class="action-button clear"
        :disabled="!hasSummary"
        @click="clearSummary"
      >
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        清空总结
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface NormalSummary {
  overview: string
  keyPoints: string[]
}

interface DetailedChapter {
  startTime: number
  endTime: number
  content: string
}

interface DetailedSummary {
  fullDescription: string
  chapters: DetailedChapter[]
  conclusion: string
}

interface Summaries {
  simple: string
  normal: NormalSummary | null
  detailed: DetailedSummary | null
}

// Props
const props = defineProps<{
  videoId?: number
  videoTitle?: string
  videoDuration?: number
}>()

// Emits
const emit = defineEmits<{
  generate: [level: string]
  export: [data: any]
}>()

// State
const activeLevel = ref<'simple' | 'normal' | 'detailed'>('simple')
const isGenerating = ref(false)

const summaryLevels = [
  { key: 'simple' as const, label: '简单总结' },
  { key: 'normal' as const, label: '一般总结' },
  { key: 'detailed' as const, label: '详细总结' }
]

// 示例数据（实际使用时应该从API获取）
const summaries = ref<Summaries>({
  simple: '',
  normal: null,
  detailed: null
})

// Computed
const hasSummary = computed(() => {
  return summaries.value.simple || summaries.value.normal || summaries.value.detailed
})

// Methods
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const generateSummary = async () => {
  isGenerating.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成示例数据
    summaries.value = {
      simple: '这是一个关于视频内容的简要概述，包含了主要观点和核心信息。视频时长约 ' + (props.videoDuration ? Math.floor(props.videoDuration / 60) : 0) + ' 分钟，涵盖了多个重要知识点。',
      normal: {
        overview: '本视频深入探讨了相关主题，通过清晰的讲解和实例展示，帮助观众理解核心概念。视频结构合理，内容循序渐进。',
        keyPoints: [
          '介绍了基本概念和背景知识',
          '详细讲解了核心技术要点',
          '通过实际案例演示应用方法',
          '总结了最佳实践和注意事项'
        ]
      },
      detailed: {
        fullDescription: '这是一个全面的视频内容描述。视频从基础概念入手，逐步深入到高级主题。讲解者采用了理论与实践相结合的方式，通过多个实际案例帮助观众理解复杂的概念。整个视频结构清晰，逻辑严密，适合不同水平的学习者。',
        chapters: [
          {
            startTime: 0,
            endTime: 180,
            content: '开篇介绍：讲解了视频的整体框架和学习目标，为后续内容做好铺垫。'
          },
          {
            startTime: 180,
            endTime: 420,
            content: '核心概念讲解：详细阐述了基本原理和关键技术点，配合图表和动画演示。'
          },
          {
            startTime: 420,
            endTime: 660,
            content: '实践案例分析：通过三个实际项目案例，展示如何应用所学知识解决实际问题。'
          },
          {
            startTime: 660,
            endTime: 900,
            content: '总结与展望：回顾了主要内容，并提供了进一步学习的方向和资源推荐。'
          }
        ],
        conclusion: '通过本视频的学习，观众能够全面掌握相关知识点，并具备实际应用能力。视频内容丰富、讲解清晰，是一个优质的学习资源。建议结合实践练习，以加深理解和巩固所学知识。'
      }
    }
    
    emit('generate', activeLevel.value)
  } catch (error) {
    console.error('生成总结失败:', error)
  } finally {
    isGenerating.value = false
  }
}

const exportSummary = () => {
  const exportData = {
    videoId: props.videoId,
    videoTitle: props.videoTitle,
    level: activeLevel.value,
    summary: summaries.value[activeLevel.value],
    timestamp: new Date().toISOString()
  }
  
  // 创建下载
  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `video-summary-${activeLevel.value}-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  
  emit('export', exportData)
}

const clearSummary = () => {
  if (confirm('确定要清空所有总结吗？此操作不可恢复。')) {
    summaries.value = {
      simple: '',
      normal: null,
      detailed: null
    }
  }
}

// 暴露方法给父组件
defineExpose({
  generateSummary,
  clearSummary,
  summaries
})
</script>

<style scoped>
.video-summary-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: 20px;
}

.summary-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-title {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-title .icon {
  width: 24px;
  height: 24px;
}

.summary-tabs {
  display: flex;
  gap: 8px;
}

.tab-button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.tab-button.active {
  background: white;
  color: #667eea;
  border-color: white;
}

.summary-content {
  padding: 24px;
  min-height: 300px;
}

.summary-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.summary-simple,
.summary-normal,
.summary-detailed {
  display: flex;
  gap: 20px;
}

.summary-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-icon svg {
  width: 28px;
  height: 28px;
}

.summary-icon.simple {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.summary-icon.normal {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.summary-icon.detailed {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.summary-text {
  flex: 1;
  line-height: 1.8;
  color: #333;
}

.summary-text h4 {
  margin: 20px 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
}

.summary-text h4:first-child {
  margin-top: 0;
}

.summary-text p {
  margin: 0 0 12px 0;
  color: #555;
  font-size: 14px;
}

.summary-text ul {
  margin: 0;
  padding-left: 20px;
}

.summary-text li {
  margin: 8px 0;
  color: #555;
  font-size: 14px;
}

.empty-state {
  color: #999 !important;
  font-style: italic;
  text-align: center;
  padding: 40px 20px;
}

.chapter-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
  border-left: 4px solid #667eea;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chapter-number {
  font-weight: 600;
  color: #667eea;
  font-size: 14px;
}

.chapter-time {
  font-size: 12px;
  color: #888;
  font-family: 'Courier New', monospace;
}

.chapter-content {
  color: #555;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}

.summary-actions {
  padding: 16px 24px;
  background: #f8f9fa;
  display: flex;
  gap: 12px;
  border-top: 1px solid #e9ecef;
}

.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.button-icon {
  width: 18px;
  height: 18px;
}

.action-button.generate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex: 1;
}

.action-button.generate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.action-button.export {
  background: #28a745;
  color: white;
}

.action-button.export:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
}

.action-button.clear {
  background: #dc3545;
  color: white;
}

.action-button.clear:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-2px);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .summary-header {
    padding: 16px;
  }

  .summary-tabs {
    flex-wrap: wrap;
  }

  .tab-button {
    flex: 1;
    min-width: calc(33.333% - 6px);
  }

  .summary-content {
    padding: 16px;
  }

  .summary-simple,
  .summary-normal,
  .summary-detailed {
    flex-direction: column;
  }

  .summary-icon {
    align-self: flex-start;
  }

  .summary-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
