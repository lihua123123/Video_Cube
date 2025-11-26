# EditPage 知识卡片显示问题调试指南

## 🔍 问题描述

**现象**: 
- 在编辑页面(EditPage)中,知识卡片列表为空,没有显示任何卡片
- 但是返回视频页面(UserPage)后,知识卡片又能正常显示

## 🎯 可能的原因

### 1. videoId 未正确传递
- UserPage 跳转到 EditPage 时,videoId 参数可能丢失或错误
- 检查 URL 查询参数: `?videoUrl=xxx&videoId=xxx`

### 2. API 请求失败
- EditPage 的 API 请求可能返回了错误
- 检查 `/knowledge_cards?video_id=${videoId}` 的响应

### 3. 数据转换问题
- 后端返回的数据格式可能与前端期望的格式不一致
- 检查数据映射逻辑

### 4. 显示条件问题
- `showExampleCards` 状态可能阻止了卡片显示
- `v-show="!showExampleCards"` 条件检查

## 🧪 调试步骤

### 第1步: 检查浏览器控制台

刷新 EditPage 页面,查看控制台输出:

```
═══════════════════════════════════════
📚 EditPage - 开始加载知识卡片
   videoId: 1
   API路径: /knowledge_cards?video_id=1
   API响应: { status: true, data: {...} }
   ✅ API返回 3 个卡片
   卡片详情: [...]
   ✅ 已转换并排序 3 个知识卡片
   userCards.value: [...]
═══════════════════════════════════════
```

### 第2步: 检查关键值

在控制台中,关注以下信息:

1. **videoId**: 
   - 应该是一个有效的数字
   - 如果是 `undefined` 或 `null`,说明 URL 参数传递有问题

2. **API响应**: 
   - `status` 应该是 `true`
   - `data.knowledgeCards` 应该包含卡片数组

3. **卡片数量**:
   - 如果返回 0,说明数据库中该视频没有卡片
   - 如果返回 > 0,但列表不显示,可能是渲染问题

### 第3步: 检查 URL 参数

在浏览器地址栏检查 URL:
```
http://localhost:5173/edit?videoUrl=xxx&videoId=1
```

- `videoId` 参数必须存在
- 值必须是有效数字

### 第4步: 检查 userCards 监控

控制台会输出:
```
🔍 userCards 变化:
   数量: 3
   内容: [...]
```

- 如果数量是 0,说明加载失败
- 如果数量 > 0,但列表不显示,可能是 CSS 或 v-show 问题

## 🔧 已添加的调试功能

### 1. 详细的控制台日志

**位置**: `EditPage.vue` 第1265-1322行

```typescript
const loadCardsFromDatabase = async () => {
  console.log('═══════════════════════════════════════')
  console.log('📚 EditPage - 开始加载知识卡片')
  console.log(`   videoId: ${videoId.value}`)
  console.log(`   API路径: /knowledge_cards?video_id=${videoId.value}`)
  
  const response = await fetchFromApi(...)
  console.log('   API响应:', response)
  console.log(`   ✅ API返回 ${allCards.length} 个卡片`)
  console.log('   卡片详情:', allCards)
  console.log(`   ✅ 已转换并排序 ${userCards.value.length} 个知识卡片`)
  console.log('   userCards.value:', userCards.value)
  console.log('═══════════════════════════════════════')
}
```

### 2. userCards 变化监控

**位置**: `EditPage.vue` 第1493-1498行

```typescript
watch(() => userCards.value, (newCards) => {
  console.log('🔍 userCards 变化:')
  console.log('   数量:', newCards.length)
  console.log('   内容:', newCards)
}, { deep: true, immediate: true })
```

## 🎯 常见问题及解决方案

### 问题1: videoId 为 undefined

**症状**:
```
📚 EditPage - 开始加载知识卡片
   videoId: undefined
```

**原因**: URL 参数未正确传递

**解决方案**:
1. 检查 UserPage 的 `goToEditPage()` 函数
2. 确保 `videoId.value` 有值
3. 确保 `router.push()` 包含正确的查询参数

```typescript
router.push({
  path: '/edit',
  query: { 
    videoUrl: encodedUrl,
    videoId: videoId.value?.toString() || '1'  // ✅ 确保有默认值
  }
})
```

### 问题2: API 返回空数组

**症状**:
```
✅ API返回 0 个卡片
```

**原因**: 数据库中该视频没有知识卡片

**解决方案**:
1. 在 UserPage 创建几个测试卡片
2. 确保卡片的 `video_id` 与 URL 中的 `videoId` 一致
3. 检查数据库表 `knowledge_cards`

### 问题3: API 返回有卡片,但列表不显示

**症状**:
```
✅ API返回 3 个卡片
✅ 已转换并排序 3 个知识卡片
🔍 userCards 变化: 数量: 3
```
但页面上看不到卡片

**可能原因**:
1. `showExampleCards` 为 `true` (应该是 `false`)
2. CSS 样式问题(卡片被隐藏)
3. `v-show` 条件错误

**解决方案**:

1. 检查 `showExampleCards` 值:
```javascript
console.log('showExampleCards:', showExampleCards.value)  // 应该是 false
```

2. 检查元素是否存在:
打开浏览器开发者工具,查看 DOM 结构,搜索 `card-item`

3. 检查 CSS:
```css
.card-item {
  display: block;  /* 不应该是 none */
}
```

### 问题4: 数据格式不匹配

**症状**:
```
❌ TypeError: Cannot read property 'title' of undefined
```

**原因**: 后端返回的数据结构与前端期望不一致

**解决方案**:
检查数据转换逻辑,确保所有必需字段都存在:

```typescript
userCards.value = allCards.map((card: any) => ({
  id: card.id,
  video_id: card.video_id,
  startTime: card.start_time || 0,        // ✅ 提供默认值
  endTime: card.end_time || 0,            // ✅ 提供默认值
  title: card.title || '未命名卡片',      // ✅ 提供默认值
  content: card.content || '',            // ✅ 提供默认值
  // ...
}))
```

## 📊 对比 UserPage 和 EditPage

### UserPage 加载逻辑

**位置**: `UserPage.vue` 第745-801行

```typescript
const fetchKnowledgeCards = async () => {
  if (!videoId.value) return
  
  const response = await fetch(`/api/admin/knowledge_cards?video_id=${videoId.value}`)
  const data = await response.json()
  
  knowledgeCards.value = data.data?.knowledgeCards || []
}
```

### EditPage 加载逻辑

**位置**: `EditPage.vue` 第1265-1322行

```typescript
const loadCardsFromDatabase = async () => {
  const response = await fetchFromApi(`/knowledge_cards?video_id=${videoId.value}`)
  
  userCards.value = response.data.knowledgeCards || []
}
```

### 关键差异

| 特性 | UserPage | EditPage |
|------|----------|----------|
| API 路径 | `/api/admin/knowledge_cards` | `/knowledge_cards` |
| API 前缀 | `/api` | 无(通过 fetchFromApi) |
| 数据存储 | `knowledgeCards.value` | `userCards.value` |
| 数据转换 | 简单映射 | 复杂映射+兼容字段 |

## ✅ 验证清单

完成以下检查,确认问题已解决:

- [ ] 控制台显示正确的 videoId
- [ ] API 返回非空卡片数组
- [ ] userCards.value 包含正确数量的卡片
- [ ] 页面上能看到卡片列表
- [ ] 点击卡片能正常选中和编辑
- [ ] 从 UserPage 跳转到 EditPage 卡片正常显示
- [ ] 从 EditPage 返回 UserPage 卡片正常显示

## 🚀 下一步行动

如果按照以上步骤调试后仍然无法解决:

1. **截图控制台日志**,查看完整的调试输出
2. **检查网络请求**,在开发者工具的 Network 标签查看 API 请求和响应
3. **检查 DOM 结构**,确认卡片元素是否被正确渲染
4. **检查 Vue DevTools**,查看组件状态和数据

---

**创建时间**: 2025年11月24日  
**调试状态**: 🔍 等待测试反馈
