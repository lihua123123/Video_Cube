# LinkContentModal 拖动缩放功能修复说明

## 🔧 问题诊断

发现 `LinkContentModal` 组件无法拖动和缩放的主要问题:

### 1. **CSS约束问题**
```css
/* 问题代码 */
.link-modal-container {
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
}
```
- `max-width` 和 `max-height` 会覆盖动态设置的样式
- 百分比宽度在fixed定位下不适用

### 2. **初始化时机问题**
- DOM未完全渲染就尝试获取尺寸
- 需要使用 `nextTick` + `setTimeout` 确保渲染完成

### 3. **布局结构问题**
- 拖动手柄和标题没有正确的容器包裹
- 导致flex布局不正确

## ✅ 修复方案

### 1. 修改容器样式 (Line 476-488)

```css
/* 修复后 */
.link-modal-container {
  background: white;
  border-radius: 12px;
  width: 900px;          /* 固定初始宽度 */
  height: 600px;         /* 固定初始高度 */
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}
```

### 2. 优化初始化位置函数 (Line 276-290)

```typescript
const initPosition = () => {
  if (!modalRef.value || isPositioned.value) return;
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 初始化尺寸 - 确保不超出视口
  modalWidth.value = Math.min(900, viewportWidth - 40);
  modalHeight.value = Math.min(600, viewportHeight - 40);
  
  // 居中显示
  modalX.value = (viewportWidth - modalWidth.value) / 2;
  modalY.value = (viewportHeight - modalHeight.value) / 2;
  
  isPositioned.value = true;
};
```

### 3. 改进初始化时机 (Line 434-454)

```typescript
// 添加 nextTick 导入
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

// 监听可见性变化
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    await nextTick();              // 等待DOM更新
    setTimeout(() => {              // 再等待50ms确保渲染完成
      initPosition();
    }, 50);
  }
});

// 组件挂载
onMounted(async () => {
  if (props.visible) {
    await nextTick();
    setTimeout(() => {
      initPosition();
    }, 50);
  }
});
```

### 4. 优化头部布局 (Line 10-26)

```vue
<div class="link-modal-header" @mousedown="handleDragStart">
  <div class="header-left">
    <div class="drag-handle" title="拖动移动窗口">
      <!-- 拖动图标 -->
    </div>
    <div class="link-modal-title">{{ title || '链接内容' }}</div>
  </div>
  <button class="link-modal-close" @click="handleClose">
    <!-- 关闭按钮 -->
  </button>
</div>
```

### 5. 添加头部容器样式 (Line 498-504)

```css
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;  /* 允许flex子元素收缩 */
}
```

## 🎯 功能验证清单

### 拖动功能 ✅
- [x] 点击标题栏可拖动窗口
- [x] 拖动时光标变为 `grabbing`
- [x] 拖动时阴影增强
- [x] 拖动手柄图标可见且在悬停时高亮
- [x] 点击关闭按钮不触发拖动
- [x] 窗口限制在视口内

### 缩放功能 ✅
- [x] 右下角缩放手柄可见
- [x] 拖动手柄可调整窗口大小
- [x] 缩放时光标变为 `nwse-resize`
- [x] 缩放时显示蓝色边框
- [x] 最小尺寸限制 (500x400)
- [x] 最大尺寸限制 (1400x900)
- [x] 缩放不超出视口

### 初始化 ✅
- [x] 首次打开自动居中
- [x] 初始尺寸 900x600
- [x] 响应视口大小变化

## 🔍 关键代码对比

### 修复前
```css
.link-modal-container {
  width: 90%;              /* ❌ 百分比宽度 */
  max-width: 900px;        /* ❌ 限制最大宽度 */
  max-height: 80vh;        /* ❌ 限制最大高度 */
}
```

### 修复后
```css
.link-modal-container {
  width: 900px;            /* ✅ 固定初始宽度 */
  height: 600px;           /* ✅ 固定初始高度 */
  /* 不设置max-width/max-height，由动态样式控制 */
}
```

## 📊 技术细节

### 动态样式优先级
```typescript
const modalStyle = computed(() => {
  if (!isPositioned.value) {
    return {};  // 初始化前使用CSS默认样式
  }
  
  return {
    position: 'fixed',     // 覆盖默认定位
    left: `${modalX.value}px`,
    top: `${modalY.value}px`,
    width: `${modalWidth.value}px`,   // 覆盖CSS宽度
    height: `${modalHeight.value}px`, // 覆盖CSS高度
    transform: 'none',
    margin: '0'
  };
});
```

### 初始化流程
```
1. 组件mounted / props.visible变化
   ↓
2. await nextTick() - 等待DOM更新
   ↓
3. setTimeout(50ms) - 等待渲染完成
   ↓
4. initPosition() - 计算并设置位置
   ↓
5. isPositioned = true
   ↓
6. modalStyle应用动态样式
```

## 🎨 视觉效果

### 拖动状态
```css
.is-dragging {
  cursor: grabbing !important;
  user-select: none;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);  /* 增强阴影 */
}
```

### 缩放状态
```css
.is-resizing {
  cursor: nwse-resize !important;
  user-select: none;
  border: 2px solid #667eea;  /* 蓝色边框 */
}
```

### 手柄样式
```css
.drag-handle {
  opacity: 0.6;
  transition: opacity 0.3s;
}

.link-modal-header:hover .drag-handle {
  opacity: 1;  /* 悬停时完全不透明 */
}

.resize-handle {
  opacity: 0.3;
}

.resize-handle:hover {
  opacity: 0.8;  /* 悬停时增加不透明度 */
}
```

## 🚀 使用说明

现在 `LinkContentModal` 支持以下操作:

1. **拖动**: 点击并拖动标题栏的任意位置(除了关闭按钮)
2. **缩放**: 拖动右下角的三角形图标
3. **关闭**: 点击右上角关闭按钮或点击遮罩层

所有操作都有即时的视觉反馈,提供流畅的用户体验!

## 📝 后续建议

1. **响应式优化**: 在小屏幕设备上自动调整初始尺寸
2. **记忆功能**: 保存用户调整的位置和尺寸
3. **动画优化**: 添加更平滑的过渡动画
4. **键盘支持**: 支持ESC键关闭、方向键移动等

## ✨ 总结

通过以上修复,`LinkContentModal` 现在完全支持拖动和缩放功能,与 `KnowledgeCardPopup` 保持了一致的交互体验! 🎉
