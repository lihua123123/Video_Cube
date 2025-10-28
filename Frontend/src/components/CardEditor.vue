<template>
  <div class="card-editor">
    <h2>知识卡片编辑器</h2>

    <!-- 卡片时间设置 -->
    <div class="time-section">
      <label>卡片出现时间：</label>
      <input type="text" v-model="cardTime" placeholder="0.000" />
    </div>

    <!-- 卡片内容编辑 -->
    <div class="card-content">
      <div class="form-group">
        <label>标题：</label>
        <input type="text" v-model="cardTitle" placeholder="输入卡片标题" />
      </div>

      <div class="form-group">
        <label>内容：</label>
        <textarea v-model="cardContent" rows="4" placeholder="输入卡片内容"></textarea>
      </div>

      <!-- 格式工具栏 -->
      <div class="toolbar">
        <button @click="formatText('bold')"><strong>B</strong></button>
        <button @click="formatText('italic')"><em>I</em></button>
        <button @click="formatText('underline')"><u>U</u></button>
      </div>
    </div>

    <!-- 功能按钮 -->
    <div class="card-actions">
      <button @click="saveCard" class="btn primary-btn">保存当前卡片</button>
      <button @click="addCard" class="btn secondary-btn">添加新卡片</button>
      <button @click="deleteCard" class="btn danger-btn">删除卡片</button>
    </div>

    <!-- 卡片列表 -->
    <div class="card-list">
      <h3>卡片列表</h3>
      <div
        v-for="(card, index) in cards"
        :key="index"
        :class="['card-item', `card-color-${index % 4}`]"
        @click="selectCard(index)"
      >
        <div class="card-time">{{ card.time }}s</div>
        <div class="card-preview">{{ card.title }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'CardEditor',
  data() {
    return {
      cardTime: '0.000', // 卡片出现时间
      cardTitle: '', // 卡片标题
      cardContent: '', // 卡片内容
      cards: [], // 存储所有卡片的数组
      selectedCardIndex: -1, // 当前选中的卡片索引
    }
  },
  methods: {
    // 格式化文本
    formatText(type) {
      console.log('格式化文本:', type)
      // 实际开发中这里会实现富文本编辑功能
    },

    // 保存卡片
    saveCard() {
      if (this.cardTitle && this.cardContent) {
        const card = {
          time: this.cardTime,
          title: this.cardTitle,
          content: this.cardContent,
        }

        if (this.selectedCardIndex >= 0) {
          // 更新现有卡片
          this.cards[this.selectedCardIndex] = card
        } else {
          // 添加新卡片
          this.cards.push(card)
        }

        this.clearForm()
        console.log('卡片已保存')
      } else {
        alert('请填写卡片标题和内容')
      }
    },

    // 添加新卡片
    addCard() {
      this.selectedCardIndex = -1
      this.clearForm()
    },

    // 删除卡片
    deleteCard() {
      if (this.selectedCardIndex >= 0) {
        this.cards.splice(this.selectedCardIndex, 1)
        this.clearForm()
      }
    },

    // 选择卡片进行编辑
    selectCard(index) {
      this.selectedCardIndex = index
      const card = this.cards[index]
      this.cardTime = card.time
      this.cardTitle = card.title
      this.cardContent = card.content
    },

    // 清空表单
    clearForm() {
      this.cardTime = '0.000'
      this.cardTitle = ''
      this.cardContent = ''
      this.selectedCardIndex = -1
    },
  },
}
</script>

<style scoped>
.card-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.time-section {
  margin: 15px 0;
}

.time-section input {
  width: 100px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group {
  margin: 15px 0;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.toolbar {
  margin: 10px 0;
}

.toolbar button {
  margin-right: 10px;
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.primary-btn {
  background: #1890ff;
  color: white;
}
.secondary-btn {
  background: #f5f5f5;
}
.danger-btn {
  background: #ff4d4f;
  color: white;
}

.card-list {
  flex: 1;
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.card-item {
  padding: 10px;
  margin: 8px 0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.card-color-0 {
  background: #e6f7ff;
}
.card-color-1 {
  background: #f6ffed;
}
.card-color-2 {
  background: #fff7e6;
}
.card-color-3 {
  background: #f9f0ff;
}

.card-time {
  font-weight: bold;
  margin-right: 10px;
  min-width: 50px;
}

.card-preview {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
