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
            <button @click="deleteCard" class="action-btn delete-card-btn">删除卡</button>
            <button @click="saveCard" class="action-btn save-card-btn">保存卡</button>
          </div>
        </div>

        <!-- 卡片列表 -->
        <div class="card-list-container">
          <h4>卡片列表</h4>
          <div class="cards-list">
            <div
              v-for="(card, index) in cardList"
              :key="index"
              :class="['card-item', { active: selectedCardIndex === index }]"
              @click="selectCard(index)"
            >
              <!-- 卡片头部 -->
              <div class="card-header">
                <span class="card-time">{{ card.time }}s</span>
                <span class="card-title">{{ card.title }}</span>
                <div v-if="selectedCardIndex === index" class="card-actions">
                  <img
                    src="@/assets/images/iconEdit.png"
                    alt="编辑"
                    class="action-icon"
                    @click.stop="editCard(index)"
                  />
                  <img
                    src="@/assets/images/iconDelete.png"
                    alt="删除"
                    class="action-icon"
                    @click.stop="deleteCard(index)"
                  />
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

      <!-- 右侧：视频预览 - 修改为横屏尺寸 -->
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
          <h3>知识卡片编辑</h3>
          <button @click="closeModal" class="modal-close">×</button>
        </div>

        <div class="modal-body">
          <!-- 时间设置 -->
          <div class="time-setting">
            <label>卡片出现时间（秒）</label>
            <div class="time-input-wrapper">
              <input type="number" v-model="cardTime" min="0" step="1" class="time-input" />
            </div>
          </div>

          <!-- 富文本工具栏 -->
          <div class="rich-text-toolbar">
            <button @click="formatText('bold')" class="tool-btn" title="加粗">
              <img src="@/assets/images/fa5-bold-fas.png" alt="加粗" class="tool-icon" />
            </button>
            <button @click="formatText('italic')" class="tool-btn" title="斜体">
              <img src="@/assets/images/if-italic-alt.png" alt="斜体" class="tool-icon" />
            </button>
            <button @click="formatText('link')" class="tool-btn" title="链接">
              <img
                src="@/assets/images/semiDesign-semi-icons-link.png"
                alt="链接"
                class="tool-icon"
              />
            </button>
            <button @click="insertImage" class="tool-btn" title="插入图片">
              <img src="@/assets/images/riLine-image-line.png" alt="图片" class="tool-icon" />
            </button>
            <button @click="insertFormula" class="tool-btn" title="插入公式">
              <img src="@/assets/images/iconPark-formula.png" alt="公式" class="tool-icon" />
            </button>
            <button @click="openColorPicker" class="tool-btn" title="颜色">
              <img src="@/assets/images/md-palette.png" alt="颜色" class="tool-icon" />
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 卡片列表数据（包含三种总结类型）
const cardList = ref([
  {
    time: 15,
    title: '平行线的性质',
    activeTab: 'brief', // 当前激活的选项卡
    summaries: {
      brief: '两直线平行，同位角相等，内错角相等，同旁内角互补。',
      normal: '1. 两直线平行，同位角相等\n2. 两直线平行，内错角相等\n3. 两直线平行，同旁内角互补',
      detailed:
        '平行线性质详解：\n\n1. 同位角相等：两条平行线被第三条直线所截，同位角相等。\n2. 内错角相等：两条平行线被第三条直线所截，内错角相等。\n3. 同旁内角互补：两条平行线被第三条直线所截，同旁内角之和为180度。',
    },
  },
  {
    time: 45,
    title: '牛顿第二定律',
    activeTab: 'brief',
    summaries: {
      brief: 'F=ma，物体加速度与合外力成正比，与质量成反比。',
      normal:
        '核心公式：F=ma\n\nF代表物体所受的合外力(单位:牛顿，N)\nm代表物体的质量(单位:千克，kg)\na代表物体的加速度(单位:米/秒²，m/s²)',
      detailed:
        '牛顿第二定律详解：\n\n核心公式：F = ma\n\n物理意义：\n1. 物体加速度与合外力成正比：F ∝ a\n2. 加速度与物体质量成反比：a ∝ 1/m\n\n完整表达式：F = ma（F为合力，m为质量，a为加速度）\n\n应用说明：该定律描述了力、质量和加速度之间的关系，是经典力学的核心定律之一。',
    },
  },
])

// 选中状态
const selectedCardIndex = ref(-1)

// 弹窗相关状态
const showCardModal = ref(false)
const cardTime = ref(0)
const cardTitle = ref('')
const cardContent = ref('')
const editingCardIndex = ref(-1) // -1表示新增，>=0表示编辑

// 方法定义
const goBack = () => {
  router.push('/user')
}

const selectCard = (index: number) => {
  selectedCardIndex.value = index
}

// 切换卡片内的选项卡
const switchTab = (cardIndex: number, tabType: string) => {
  cardList.value[cardIndex].activeTab = tabType
}

const editCard = (index: number) => {
  const card = cardList.value[index]
  cardTime.value = card.time
  cardTitle.value = card.title
  cardContent.value = card.summaries.normal // 默认编辑一般总结
  editingCardIndex.value = index
  showCardModal.value = true
}

const addNewCard = () => {
  // 重置表单
  cardTime.value = 0
  cardTitle.value = ''
  cardContent.value = ''
  editingCardIndex.value = -1
  showCardModal.value = true
}

const deleteCard = (index?: number) => {
  const targetIndex = index ?? selectedCardIndex.value
  if (targetIndex >= 0 && targetIndex < cardList.value.length) {
    if (confirm('确定要删除这张卡片吗？')) {
      cardList.value.splice(targetIndex, 1)
      selectedCardIndex.value = -1
    }
  } else {
    alert('请先选择要删除的卡片')
  }
}

const saveCard = () => {
  if (selectedCardIndex.value >= 0) {
    editCard(selectedCardIndex.value)
  } else {
    alert('请先选择要保存的卡片')
  }
}

const aiAnalyze = () => {
  console.log('AI分析视频内容')
  // 后续实现AI分析逻辑
}

const saveCurrentCard = () => {
  if (!cardTitle.value.trim() || !cardContent.value.trim()) {
    alert('请填写卡片标题和内容')
    return
  }

  const cardData = {
    time: cardTime.value,
    title: cardTitle.value,
    activeTab: 'brief',
    summaries: {
      brief: cardContent.value.substring(0, 50) + '...', // 简略版
      normal: cardContent.value, // 一般版
      detailed: cardContent.value + '\n\n详细说明：' + cardContent.value, // 详细版
    },
  }

  if (editingCardIndex.value >= 0) {
    // 编辑现有卡片
    cardList.value[editingCardIndex.value] = cardData
  } else {
    // 新增卡片
    cardList.value.push(cardData)
  }

  closeModal()
}

const closeModal = () => {
  showCardModal.value = false
  editingCardIndex.value = -1
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

onMounted(() => {
  // 初始化数据
  if (cardList.value.length > 0) {
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
  background: #fefa83;
  color: #333;
  border: 1px solid #bbbbbb;
}

.add-card-btn {
  background: #00b42a;
  color: white;
}

.delete-card-btn {
  background: #f5f5f5;
  color: #333;
}

.save-card-btn {
  background: #1890ff;
  color: white;
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

/* 右侧视频预览 - 修改为横屏尺寸 */
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
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  height: 300px; /* 横屏视频高度 */
  position: relative;
  flex: 1;
}

.video-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background: #1a1a1a;
  flex-direction: column;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #8b5cf6;
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

.time-input-wrapper {
  display: flex;
}

.time-input {
  width: 100px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

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
}
</style>
