<template>
  <div class="edit-container">
    <!-- 顶部标题栏 -->
    <header class="header">
      <h1>知识卡片编辑器</h1>
      <button @click="goBack" class="back-btn">返回视频页面</button>
    </header>

    <!-- 主内容区 - 三栏布局 -->
    <main class="main-content">
      <!-- 左侧：我的项目侧边栏 -->
      <section class="project-sidebar">
        <h3>我的项目</h3>
        <div class="project-list">
          <div class="project-item active">
            <div class="project-info">
              <div class="project-title">专项练习视频</div>
            </div>
          </div>
          <div class="project-item active">
            <div class="project-info">
              <div class="project-title">大纲图</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 中间：卡片编辑 -->
      <section class="card-editor-section">
        <div class="editor-header">
          <h2>卡片编辑</h2>
          <div class="editor-actions">
            <button @click="aiAnalyze" class="action-btn ai-analysis-btn">AI分析</button>
            <button @click="addNewCard" class="action-btn add-card-btn">+ 新增卡</button>
            <div class="batch-actions">
              <button @click="selectAllCards" class="action-btn select-all-btn">
                {{ isAllSelected ? '取消全选' : '全选' }}
              </button>
              <button 
                @click="batchDeleteCards" 
                class="action-btn batch-delete-btn" 
                :disabled="batchSelectedCards.length === 0"
              >
                批量删除 ({{ batchSelectedCards.length }})
              </button>
            </div>
          </div>
        </div>

        <!-- 卡片列表 -->
        <div class="card-list-container">
          <h4>卡片列表 ({{ showExampleCards ? exampleCards.length : userCards.length }}) - 已选 {{ selectedCardsCount }} 张</h4>
          
          <!-- 提示查看示例卡片 -->
          <div v-if="!showExampleCards && userCards.length === 0" class="example-cards-tip" @click="toggleExampleCards">
            <span class="tip-text">📚 点击查看示例卡片</span>
          </div>
          
          <!-- 示例卡片标题栏 -->
          <div v-if="showExampleCards" class="example-cards-header">
            <span class="example-title">示例卡片</span>
            <button @click="toggleExampleCards" class="close-example-btn" title="关闭示例">
              × 关闭示例
            </button>
          </div>

          <div class="cards-list">
            <!-- 显示示例卡片 -->
            <div
              v-for="(card, index) in exampleCards"
              :key="'example-' + index"
              v-show="showExampleCards"
              :class="['card-item', 'example-card']"
            >
              <div class="card-header">
                <span class="card-time">{{ card.startTime }}s - {{ card.endTime }}s</span>
                <span class="card-title">{{ card.title }}</span>
                <div class="card-actions">
                  <div class="example-badge">示例</div>
                </div>
              </div>

              <!-- 总结类型选项卡 -->
              <div class="summary-tabs">
                <button
                  :class="['tab-btn', { active: card.activeTab === 'brief' }]"
                  @click.stop="switchExampleTab(index, 'brief')"
                >
                  简略总结
                </button>
                <button
                  :class="['tab-btn', { active: card.activeTab === 'normal' }]"
                  @click.stop="switchExampleTab(index, 'normal')"
                >
                  一般总结
                </button>
                <button
                  :class="['tab-btn', { active: card.activeTab === 'detailed' }]"
                  @click.stop="switchExampleTab(index, 'detailed')"
                >
                  详细总结
                </button>
              </div>

              <!-- 卡片内容（根据选项卡切换） -->
              <div class="card-content">
                <div v-if="card.activeTab === 'brief'" class="tab-content">
                  {{ card.summaries.brief }}
                </div>
                <div v-if="card.activeTab === 'normal'" class="tab-content">
                  {{ card.summaries.normal }}
                </div>
                <div v-if="card.activeTab === 'detailed'" class="tab-content">
                  {{ card.summaries.detailed }}
                </div>
              </div>
            </div>

            <!-- 显示用户创建的卡片 -->
            <div
              v-for="(card, index) in userCards"
              :key="'user-' + index"
              v-show="!showExampleCards"
              :class="['card-item', { 
                active: selectedCardIndex === index,
                'batch-selected': batchSelectedCards.includes(index)
              }]"
              @click="handleCardClick(index)"
            >
              <!-- 卡片头部 -->
              <div class="card-header">
                <span class="card-time">{{ card.startTime }}s - {{ card.endTime }}s</span>
                <span class="card-title">{{ card.title }}</span>
                <div class="card-actions">
                  <!-- 编辑和删除按钮 - 只在选中单个卡片且没有批量选择时显示 -->
                  <div 
                    v-if="selectedCardIndex === index && batchSelectedCards.length === 0" 
                    class="single-card-actions"
                  >
                    <img 
                      src="@/assets/images/iconEdit.png" 
                      alt="编辑" 
                      class="action-icon"
                      @click.stop="editCard(index)"
                      title="编辑卡片"
                    >
                    <img 
                      src="@/assets/images/iconDelete.png" 
                      alt="删除" 
                      class="action-icon"
                      @click.stop="deleteSingleCard(index)"
                      title="删除卡片"
                    >
                  </div>
                  
                  <div v-if="batchSelectedCards.includes(index)" class="selection-indicator">
                    ✓
                  </div>
                </div>
              </div>

              <!-- 总结类型选项卡 -->
              <div class="summary-tabs">
                <button
                  :class="['tab-btn', { active: card.activeTab === 'brief' }]"
                  @click.stop="switchTab(index, 'brief')"
                >
                  简略总结
                </button>
                <button
                  :class="['tab-btn', { active: card.activeTab === 'normal' }]"
                  @click.stop="switchTab(index, 'normal')"
                >
                  一般总结
                </button>
                <button
                  :class="['tab-btn', { active: card.activeTab === 'detailed' }]"
                  @click.stop="switchTab(index, 'detailed')"
                >
                  详细总结
                </button>
              </div>

              <!-- 卡片内容（根据选项卡切换） -->
              <div class="card-content">
                <div v-if="card.activeTab === 'brief'" class="tab-content">
                  {{ card.summaries.brief }}
                </div>
                <div v-if="card.activeTab === 'normal'" class="tab-content">
                  {{ card.summaries.normal }}
                </div>
                <div v-if="card.activeTab === 'detailed'" class="tab-content">
                  {{ card.summaries.detailed }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：视频预览 -->
      <section class="video-preview-section">
        <h3>视频预览</h3>
        <div class="video-preview-container">
          <div class="video-placeholder">
            <div class="placeholder-content">
              <div class="placeholder-icon">🎬</div>
              <p>正在加载视频预览...</p>
            </div>
          </div>
          <!-- 视频时间显示 -->
          <div class="video-time">1:00</div>
        </div>
      </section>
    </main>

    <!-- 新增卡片模态弹窗 -->
    <div v-if="showCardModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingCardIndex >= 0 ? '编辑知识卡片' : '新增知识卡片' }}</h3>
          <button @click="closeModal" class="modal-close">×</button>
        </div>

        <div class="modal-body">
          <!-- 时间设置 - 修改为时间段选择 -->
          <div class="time-setting">
            <label>卡片出现时间段（秒）</label>
            <div class="time-range-wrapper">
              <div class="time-input-group">
                <span class="time-label">开始时间：</span>
                <input type="number" v-model="cardStartTime" min="0" step="1" class="time-input" />
                <span class="time-unit">秒</span>
              </div>
              <div class="time-input-group">
                <span class="time-label">结束时间：</span>
                <input type="number" v-model="cardEndTime" min="0" step="1" class="time-input" />
                <span class="time-unit">秒</span>
              </div>
              <div class="time-duration" v-if="timeDuration > 0">
                时长：{{ timeDuration }}秒
              </div>
            </div>
          </div>

          <!-- 富文本工具栏 -->
          <div class="rich-text-toolbar">
            <button @click="formatText('bold')" class="tool-btn" title="加粗">
              <img src="@/assets/images/fa5-bold-fas.png" alt="加粗" class="tool-icon">
            </button>
            <button @click="formatText('italic')" class="tool-btn" title="斜体">
              <img src="@/assets/images/if-italic-alt.png" alt="斜体" class="tool-icon">
            </button>
            <button @click="formatText('link')" class="tool-btn" title="链接">
              <img src="@/assets/images/semiDesign-semi-icons-link.png" alt="链接" class="tool-icon">
            </button>
            <button @click="insertImage" class="tool-btn" title="插入图片">
              <img src="@/assets/images/riLine-image-line.png" alt="图片" class="tool-icon">
            </button>
            <button @click="insertFormula" class="tool-btn" title="插入公式">
              <img src="@/assets/images/iconPark-formula.png" alt="公式" class="tool-icon">
            </button>
            <button @click="openColorPicker" class="tool-btn" title="颜色">
              <img src="@/assets/images/md-palette.png" alt="颜色" class="tool-icon">
            </button>
          </div>

          <!-- 卡片标题输入 -->
          <div class="card-title-input">
            <label>卡片标题</label>
            <input type="text" v-model="cardTitle" placeholder="输入卡片标题" class="title-input" />
          </div>

          <!-- 卡片内容编辑 -->
          <div class="card-content-editor">
            <label>卡片内容</label>
            <textarea
              v-model="cardContent"
              rows="6"
              placeholder="输入卡片内容..."
              class="content-textarea"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="saveCurrentCard" class="modal-btn save-btn">保存卡片</button>
          <button @click="closeModal" class="modal-btn cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 定义卡片类型
interface CardSummary {
  brief: string
  normal: string
  detailed: string
}

interface Card {
  startTime: number
  endTime: number
  title: string
  activeTab: 'brief' | 'normal' | 'detailed'
  summaries: CardSummary
}

// 用户创建的卡片列表（初始为空）
const userCards = ref<Card[]>([])

// 示例卡片数据
const exampleCards = ref<Card[]>([
  {
    startTime: 10,
    endTime: 25,
    title: '平行线的性质',
    activeTab: 'brief',
    summaries: {
      brief: '两直线平行，同位角相等，内错角相等，同旁内角互补。',
      normal: '1. 两直线平行，同位角相等\n2. 两直线平行，内错角相等\n3. 两直线平行，同旁内角互补',
      detailed: '平行线性质详解：\n\n1. 同位角相等：两条平行线被第三条直线所截，同位角相等。\n2. 内错角相等：两条平行线被第三条直线所截，内错角相等。\n3. 同旁内角互补：两条平行线被第三条直线所截，同旁内角之和为180度。',
    },
  },
  {
    startTime: 40,
    endTime: 60,
    title: '牛顿第二定律',
    activeTab: 'brief',
    summaries: {
      brief: 'F=ma，物体加速度与合外力成正比，与质量成反比。',
      normal: '核心公式：F=ma\n\nF代表物体所受的合外力(单位:牛顿，N)\nm代表物体的质量(单位:千克，kg)\na代表物体的加速度(单位:米/秒²，m/s²)',
      detailed: '牛顿第二定律详解：\n\n核心公式：F = ma\n\n物理意义：\n1. 物体加速度与合外力成正比\n2. 加速度与物体质量成反比\n\n完整表达式：F = ma（F为合力，m为质量，a为加速度）\n\n应用说明：该定律描述了力、质量和加速度之间的关系，是经典力学的核心定律之一。',
    },
  }
])

// 响应式状态
const selectedCardIndex = ref(-1)
const batchSelectedCards = ref<number[]>([])
const showCardModal = ref(false)
const cardStartTime = ref(0)
const cardEndTime = ref(0)
const cardTitle = ref('')
const cardContent = ref('')
const editingCardIndex = ref(-1)
const showExampleCards = ref(false)

// 计算属性
const isAllSelected = computed(() => {
  const currentCards = showExampleCards.value ? exampleCards.value : userCards.value
  return batchSelectedCards.value.length === currentCards.length && currentCards.length > 0
})

const selectedCardsCount = computed(() => {
  return batchSelectedCards.value.length
})

const timeDuration = computed(() => {
  return Math.max(0, cardEndTime.value - cardStartTime.value)
})

// 方法定义
const goBack = () => {
  router.push('/user')
}

const handleCardClick = (index: number) => {
  if (batchSelectedCards.value.length > 0) {
    toggleCardSelection(index)
  } else {
    selectCard(index)
  }
}

const selectCard = (index: number) => {
  if (index < 0 || index >= userCards.value.length) return
  selectedCardIndex.value = index
  batchSelectedCards.value = []
}

const toggleCardSelection = (index: number) => {
  if (index < 0 || index >= userCards.value.length) return
  
  if (batchSelectedCards.value.includes(index)) {
    batchSelectedCards.value = batchSelectedCards.value.filter(i => i !== index)
  } else {
    batchSelectedCards.value.push(index)
  }
  selectedCardIndex.value = -1
}

const selectAllCards = () => {
  const currentCards = showExampleCards.value ? exampleCards.value : userCards.value
  
  if (isAllSelected.value) {
    batchSelectedCards.value = []
  } else {
    batchSelectedCards.value = currentCards.map((_, index) => index)
  }
  selectedCardIndex.value = -1
}

const switchTab = (cardIndex: number, tabType: 'brief' | 'normal' | 'detailed') => {
  if (cardIndex < 0 || cardIndex >= userCards.value.length) return
  
  const card = userCards.value[cardIndex]
  if (card) {
    card.activeTab = tabType
  }
}

// 示例卡片相关方法
const switchExampleTab = (cardIndex: number, tabType: 'brief' | 'normal' | 'detailed') => {
  if (cardIndex < 0 || cardIndex >= exampleCards.value.length) return
  
  const card = exampleCards.value[cardIndex]
  if (card) {
    card.activeTab = tabType
  }
}

const toggleExampleCards = () => {
  showExampleCards.value = !showExampleCards.value
  // 切换时清空选中状态
  selectedCardIndex.value = -1
  batchSelectedCards.value = []
}

// 编辑卡片功能
const editCard = (index: number) => {
  if (index < 0 || index >= userCards.value.length) return
  
  const card = userCards.value[index]
  if (!card) return
  
  cardStartTime.value = card.startTime
  cardEndTime.value = card.endTime
  cardTitle.value = card.title
  cardContent.value = card.summaries.normal
  editingCardIndex.value = index
  showCardModal.value = true
}

const addNewCard = () => {
  cardStartTime.value = 0
  cardEndTime.value = 0
  cardTitle.value = ''
  cardContent.value = ''
  editingCardIndex.value = -1
  showCardModal.value = true
}

// 删除单个卡片功能
const deleteSingleCard = (index: number) => {
  if (index < 0 || index >= userCards.value.length) return
  
  const card = userCards.value[index]
  if (!card) return
  
  if (confirm(`确定要删除"${card.title}"这张卡片吗？`)) {
    userCards.value.splice(index, 1)
    // 更新选中状态
    if (selectedCardIndex.value === index) {
      selectedCardIndex.value = -1
    }
    // 更新批量选择索引
    batchSelectedCards.value = batchSelectedCards.value
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i)
  }
}

// 批量删除功能
const batchDeleteCards = () => {
  if (batchSelectedCards.value.length === 0) {
    alert('请先选择要删除的卡片')
    return
  }
  
  if (confirm(`确定要删除选中的 ${batchSelectedCards.value.length} 张卡片吗？`)) {
    // 从大到小排序删除
    const sortedIndexes = [...batchSelectedCards.value].sort((a, b) => b - a)
    sortedIndexes.forEach(index => {
      if (index >= 0 && index < userCards.value.length) {
        const card = userCards.value[index]
        // 添加空值检查
        if (card) {
          userCards.value.splice(index, 1)
        }
      }
    })
    batchSelectedCards.value = []
  }
}

const aiAnalyze = () => {
  console.log('AI分析视频内容')
}

// 富文本编辑方法
const formatText = (type: string) => {
  console.log('格式化文本:', type)
  // 后续实现富文本编辑逻辑
}

const insertImage = () => {
  console.log('插入图片')
}

const insertFormula = () => {
  console.log('插入公式')
}

const openColorPicker = () => {
  console.log('打开颜色选择器')
}

const saveCurrentCard = () => {
  if (!cardTitle.value.trim() || !cardContent.value.trim()) {
    alert('请填写卡片标题和内容')
    return
  }

  if (cardStartTime.value >= cardEndTime.value) {
    alert('结束时间必须大于开始时间')
    return
  }

  const cardData: Card = {
    startTime: cardStartTime.value,
    endTime: cardEndTime.value,
    title: cardTitle.value,
    activeTab: 'brief',
    summaries: {
      brief: cardContent.value.substring(0, 50) + (cardContent.value.length > 50 ? '...' : ''),
      normal: cardContent.value,
      detailed: cardContent.value + '\n\n详细说明：' + cardContent.value,
    },
  }

  if (editingCardIndex.value >= 0) {
    userCards.value[editingCardIndex.value] = cardData
  } else {
    userCards.value.push(cardData)
  }

  closeModal()
}

const closeModal = () => {
  showCardModal.value = false
  editingCardIndex.value = -1
}

onMounted(() => {
  if (userCards.value.length > 0) {
    selectedCardIndex.value = 0
  }
})
</script>

<style scoped>
.edit-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: #4682b4;
  color: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.back-btn {
  background: #89b40b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.main-content {
  flex: 1;
  display: flex;
  height: calc(100vh - 60px);
}

/* 左侧项目侧边栏 */
.project-sidebar {
  width: 220px;
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 20px;
  overflow-y: auto;
}

.project-sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-item {
  padding: 20px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #00b42a;
  border: 1px solid #00b42a;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-item:hover {
  opacity: 0.9;
}

.project-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.project-title {
  font-weight: 600;
  font-size: 14px;
  color: white;
  text-align: center;
  line-height: 1.2;
}

/* 中间卡片编辑器 */
.card-editor-section {
  flex: 1;
  background: white;
  padding: 20px;
  overflow-y: auto;
  min-width: 0;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.editor-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.editor-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.ai-analysis-btn {
  background: #006dda;
  color: white;
}

.add-card-btn {
  background: #00b42a;
  color: white;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.select-all-btn {
  background: #3abef9;
  color: white;
}

.batch-delete-btn {
  background: #ff4d4f;
  color: white;
  font-weight: 600;
}

.batch-delete-btn:disabled {
  background: #d9d9d9;
  color: #8c8c8c;
  cursor: not-allowed;
}

.card-list-container {
  margin-bottom: 24px;
}

.card-list-container h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-item.active {
  border-color: #1890ff;
  background: #f0f7ff;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.2);
}

.card-item.batch-selected {
  border-color: #ff4d4f;
  background: #fff2f0;
  box-shadow: 0 2px 6px rgba(255, 77, 79, 0.2);
}

.card-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-time {
  background: #1890ff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.card-title {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  flex: 1;
  margin-left: 8px;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.single-card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.action-icon:hover {
  opacity: 1;
}

.selection-indicator {
  background: #52c41a;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* 总结类型选项卡 */
.summary-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn.active {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: #1890ff;
}

.tab-btn:hover {
  background: #e6f7ff;
}

/* 卡片内容 */
.card-content {
  min-height: 60px;
}

.tab-content {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
}

/* 右侧视频预览 */
.video-preview-section {
  width: 450px;
  background: white;
  border-left: 1px solid #e8e8e8;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.video-preview-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.video-preview-container {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background: #1a1a1a;
  flex-direction: column;
}

.placeholder-content {
  text-align: center;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.video-placeholder p {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.video-time {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

/* 模态弹窗样式 */
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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn {
  background: #1890ff;
  color: white;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

/* 弹窗内表单样式 */
.time-setting,
.card-title-input,
.card-content-editor {
  margin-bottom: 20px;
}

.time-setting label,
.card-title-input label,
.card-content-editor label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.time-range-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-label {
  font-size: 14px;
  color: #333;
  min-width: 80px;
}

.time-input {
  width: 100px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.time-unit {
  font-size: 14px;
  color: #666;
}

.time-duration {
  padding: 8px 12px;
  background: #f0f7ff;
  border-radius: 4px;
  font-size: 14px;
  color: #1890ff;
  font-weight: 500;
}

/* 富文本工具栏 */
.rich-text-toolbar {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #f0f0f0;
  border-color: #1890ff;
}

.tool-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.title-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.content-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .project-sidebar {
    width: 200px;
  }
  .video-preview-section {
    width: 320px;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  .project-sidebar,
  .video-preview-section {
    width: 100%;
    border-right: none;
    border-left: none;
  }
  
  .time-input-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .time-label {
    min-width: auto;
  }
}

/* 示例卡片相关样式 */
.example-cards-tip {
  padding: 12px 16px;
  background: #f0f7ff;
  border: 1px dashed #1890ff;
  border-radius: 6px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.example-cards-tip:hover {
  background: #e6f7ff;
  border-color: #40a9ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.tip-text {
  color: #1890ff;
  font-size: 14px;
  font-weight: 500;
}

.example-cards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  margin-bottom: 16px;
}

.example-title {
  color: #52c41a;
  font-size: 14px;
  font-weight: 600;
}

.close-example-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.close-example-btn:hover {
  background: #ff7875;
  transform: scale(1.05);
}

.example-card {
  border-left: 4px solid #52c41a;
  background: #f6ffed;
}

.example-badge {
  background: #52c41a;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
</style>