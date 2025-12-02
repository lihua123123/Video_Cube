# Video_Cube 后端API文档

## 项目概述
Video_Cube是一个视频管理系统，后端使用Express框架和Sequelize ORM构建，提供了完整的视频、知识卡片、视频分段和AI分析任务的CRUD操作API。

## 基础路由

### 主页
- **GET /** - 显示系统主页
- **描述**: 返回系统欢迎页面
- **响应**: HTML页面

### 用户
- **GET /users** - 获取用户列表
- **描述**: 返回用户资源信息
- **响应**: `"respond with a resource"`

## 管理接口 (/admin/)

### 1. 视频管理 (videos)

#### 获取视频列表
- **GET /admin/videos**
- **描述**: 查询视频列表，支持分页和标题搜索
- **查询参数**:
  - `currentPage`: 当前页码，默认为1
  - `pageSize`: 每页条数，默认为10
  - `title`: 视频标题搜索关键词（可选）
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "查询视频列表成功",
    "data": {
      "videos": [视频对象数组]
    }
  }
  ```

#### 获取视频详情
- **GET /admin/videos/:id**
- **描述**: 根据ID查询视频详情
- **路径参数**:
  - `id`: 视频ID
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "查询视频详情成功",
    "data": {
      "video": {视频对象}
    }
  }
  ```

#### 新建视频
- **POST /admin/videos**
- **描述**: 创建新的视频记录
- **请求体**:
  - `title`: 视频标题
  - `description`: 视频描述
  - `video_url`: 视频URL
  - `thumbnail_url`: 缩略图URL
  - `duration`: 视频时长
  - `status`: 视频状态
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "新建视频成功",
    "data": {创建的视频对象}
  }
  ```

#### 删除视频
- **DELETE /admin/videos/:id**
- **描述**: 根据ID删除视频
- **路径参数**:
  - `id`: 视频ID
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "删除视频成功"
  }
  ```

#### 更新视频
- **PUT /admin/videos/:id**
- **描述**: 根据ID更新视频信息
- **路径参数**:
  - `id`: 视频ID
- **请求体**:
  - `title`: 视频标题（可选）
  - `description`: 视频描述（可选）
  - `video_url`: 视频URL（可选）
  - `thumbnail_url`: 缩略图URL（可选）
  - `duration`: 视频时长（可选）
  - `status`: 视频状态（可选）
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "更新视频成功",
    "data": {更新后的视频对象}
  }
  ```

### 2. 知识卡片管理 (knowledge_cards)

#### 获取知识卡片列表
- **GET /admin/knowledge_cards**
- **描述**: 查询知识卡片列表，支持分页和标题搜索
- **查询参数**:
  - `currentPage`: 当前页码，默认为1
  - `pageSize`: 每页条数，默认为10
  - `title`: 知识卡片标题搜索关键词（可选）
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "查询知识卡片列表成功",
    "data": {
      "knowledgeCards": [知识卡片对象数组]
    }
  }
  ```

#### 获取知识卡片详情
- **GET /admin/knowledge_cards/:id**
- **描述**: 根据ID查询知识卡片详情
- **路径参数**:
  - `id`: 知识卡片ID
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "查询知识卡片详情成功",
    "data": {
      "knowledgeCard": {知识卡片对象}
    }
  }
  ```

#### 新建知识卡片
- **POST /admin/knowledge_cards**
- **描述**: 创建新的知识卡片记录
- **请求体**:
  - `video_id`: 关联的视频ID
  - `start_time`: 开始时间
  - `end_time`: 结束时间
  - `title`: 标题
  - `content`: 内容
  - `content_type`: 内容类型
  - `display_style`: 显示样式
  - `is_ai_generated`: 是否AI生成
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "新建知识卡片成功",
    "data": {创建的知识卡片对象}
  }
  ```

#### 删除知识卡片
- **DELETE /admin/knowledge_cards/:id**
- **描述**: 根据ID删除知识卡片
- **路径参数**:
  - `id`: 知识卡片ID
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "删除知识卡片成功"
  }
  ```

#### 更新知识卡片
- **PUT /admin/knowledge_cards/:id**
- **描述**: 根据ID更新知识卡片信息
- **路径参数**:
  - `id`: 知识卡片ID
- **请求体**:
  - 可选更新字段：video_id, start_time, end_time, title, content, content_type, display_style, is_ai_generated
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "更新知识卡片成功",
    "data": {更新后的知识卡片对象}
  }
  ```

### 3. 视频分段管理 (video_segments)

#### 获取视频分段列表
- **GET /admin/video_segments**
- **描述**: 查询视频分段列表，支持分页和标题搜索
- **查询参数**:
  - `currentPage`: 当前页码，默认为1
  - `pageSize`: 每页条数，默认为10
  - `title`: 视频分段标题搜索关键词（可选）
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "查询视频分段列表成功",
    "data": {
      "videoSegments": [视频分段对象数组]
    }
  }
  ```

#### 获取视频分段详情
- **GET /admin/video_segments/:id**
- **描述**: 根据ID查询视频分段详情
- **路径参数**:
  - `id`: 视频分段ID
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "查询视频分段详情成功",
    "data": {
      "videoSegment": {视频分段对象}
    }
  }
  ```

#### 新建视频分段
- **POST /admin/video_segments**
- **描述**: 创建新的视频分段记录
- **请求体**:
  - `video_id`: 关联的视频ID
  - `segment_index`: 分段索引（必填）
  - `start_time`: 开始时间
  - `end_time`: 结束时间
  - `title`: 标题
  - `summary`: 摘要
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "新建视频分段成功",
    "data": {创建的视频分段对象}
  }
  ```

#### 删除视频分段
- **DELETE /admin/video_segments/:id**
- **描述**: 根据ID删除视频分段
- **路径参数**:
  - `id`: 视频分段ID
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "删除视频分段成功"
  }
  ```

#### 更新视频分段
- **PUT /admin/video_segments/:id**
- **描述**: 根据ID更新视频分段信息
- **路径参数**:
  - `id`: 视频分段ID
- **请求体**:
  - 可选更新字段：video_id, segment_index, start_time, end_time, title, summary
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "更新视频分段成功",
    "data": {更新后的视频分段对象}
  }
  ```

### 4. AI分析任务管理 (ai_analysis_tasks)

#### 获取AI分析任务列表
- **GET /admin/ai_analysis_tasks**
- **描述**: 查询AI分析任务列表，支持分页、状态和任务类型筛选
- **查询参数**:
  - `currentPage`: 当前页码，默认为1
  - `pageSize`: 每页条数，默认为10
  - `status`: 任务状态（可选）
  - `task_type`: 任务类型（可选）
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "查询AI分析任务列表成功",
    "data": {
      "tasks": [AI分析任务对象数组]
    }
  }
  ```

#### 获取AI分析任务详情
- **GET /admin/ai_analysis_tasks/:id**
- **描述**: 根据ID查询AI分析任务详情
- **路径参数**:
  - `id`: AI分析任务ID
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "查询AI分析任务详情成功",
    "data": {
      "task": {AI分析任务对象}
    }
  }
  ```

#### 新建AI分析任务
- **POST /admin/ai_analysis_tasks**
- **描述**: 创建新的AI分析任务记录
- **请求体**:
  - `video_id`: 关联的视频ID
  - `task_type`: 任务类型
  - `status`: 任务状态
  - `progress`: 任务进度
  - `result_data`: 结果数据
  - `error_message`: 错误信息
  - `completed_at`: 完成时间
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "新建AI分析任务成功",
    "data": {创建的AI分析任务对象}
  }
  ```

#### 删除AI分析任务
- **DELETE /admin/ai_analysis_tasks/:id**
- **描述**: 根据ID删除AI分析任务
- **路径参数**:
  - `id`: AI分析任务ID
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "删除AI分析任务成功"
  }
  ```

#### 更新AI分析任务
- **PUT /admin/ai_analysis_tasks/:id**
- **描述**: 根据ID更新AI分析任务信息
- **路径参数**:
  - `id`: AI分析任务ID
- **请求体**:
  - 可选更新字段：video_id, task_type, status, progress, result_data, error_message, completed_at
- **响应示例**:
  ```json
  {
    "status": true,
    "message": "更新AI分析任务成功",
    "data": {更新后的AI分析任务对象}
  }
  ```

## 数据模型

### Video (视频)
- `title`: 视频标题
- `description`: 视频描述
- `video_url`: 视频URL
- `thumbnail_url`: 缩略图URL
- `duration`: 视频时长
- `status`: 视频状态

### KnowledgeCard (知识卡片)
- `video_id`: 关联的视频ID
- `start_time`: 开始时间
- `end_time`: 结束时间
- `title`: 标题
- `content`: 内容
- `content_type`: 内容类型
- `display_style`: 显示样式
- `is_ai_generated`: 是否AI生成

### VideoSegment (视频分段)
- `video_id`: 关联的视频ID
- `segment_index`: 分段索引
- `start_time`: 开始时间
- `end_time`: 结束时间
- `title`: 标题
- `summary`: 摘要

### AiAnalysisTask (AI分析任务)
- `video_id`: 关联的视频ID
- `task_type`: 任务类型
- `status`: 任务状态
- `progress`: 任务进度
- `result_data`: 结果数据
- `error_message`: 错误信息
- `completed_at`: 完成时间

## 错误处理
所有API返回统一的错误格式：
```json
{
  "status": false,
  "message": "错误描述",
  "error": "错误详情（可选）"
}
```

## 响应状态码
- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误