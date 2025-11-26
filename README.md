# Video_Cube - 智能视频知识管理系统 🎬

一个基于 Vue 3 + Node.js 的智能视频知识卡片系统,支持视频上传、知识卡片编辑、AI 分析等功能。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen.svg)](https://nodejs.org/)
[![Vue](https://img.shields.io/badge/vue-3.5-green.svg)](https://vuejs.org/)

## ✨ 主要功能

- 🎥 **视频管理**: 支持本地上传和 URL 导入
- 📝 **知识卡片**: 时间轴关联的知识内容展示
- 🎨 **富文本编辑**: 支持 Markdown、公式、图片等多种格式
- 🤖 **AI 分析**: 智能视频分析和内容提取
- 🎬 **自定义播放器**: 全功能视频控制 UI
- 📚 **视频库**: 网格展示、搜索、批量管理
- 🖼️ **缩略图上传**: 手动上传或自动生成缩略图
- 📊 **视频总结**: 自动生成视频摘要和知识点

## 🚀 快速开始

### 环境要求

- **Node.js**: 20.19.0+ 或 22.12.0+
- **MySQL**: 5.7+ 或 8.0+
- **FFmpeg**: 4.0+ (用于视频处理)

### 本地开发

#### 1. 克隆项目
```bash
git clone https://github.com/yourusername/Video_Cube.git
cd Video_Cube
```

#### 2. 安装数据库
```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE video_cube CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3. 启动后端
```bash
cd Backend

# 安装依赖
npm install

# 配置数据库 (编辑 config/config.json)
# 修改数据库连接信息

# 启动服务
npm start
```

后端运行在 `http://localhost:3000`

#### 4. 启动前端
```bash
cd Frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端运行在 `http://localhost:5173`

访问 `http://localhost:5173` 即可使用!

## 📦 生产部署

### 自动部署 (Ubuntu/Debian)

使用一键部署脚本:
```bash
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

脚本会自动:
- ✅ 安装 Node.js, MySQL, FFmpeg, Nginx
- ✅ 配置数据库
- ✅ 构建和部署前后端
- ✅ 配置反向代理

### 手动部署

详细部署文档请查看: [DEPLOYMENT.md](DEPLOYMENT.md)

支持的部署方式:
- 🖥️ 传统服务器 (Ubuntu/CentOS)
- 🐳 Docker / Docker Compose
- ☁️ 云平台 (AWS, 阿里云, 腾讯云)
- 🚢 Vercel + Railway

## 📖 项目结构

```
Video_Cube/
├── Frontend/                 # 前端项目 (Vue 3 + TypeScript)
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   │   ├── VideoUpload.vue
│   │   │   ├── VideoLibrary.vue
│   │   │   ├── KnowledgeCardPopup.vue
│   │   │   ├── CardEditor.vue
│   │   │   └── ...
│   │   ├── views/           # 页面视图
│   │   │   ├── UserPage.vue
│   │   │   └── EditorPage.vue
│   │   ├── router/          # 路由配置
│   │   └── stores/          # 状态管理 (Pinia)
│   ├── public/              # 静态资源
│   └── vite.config.ts       # Vite 配置
│
├── Backend/                  # 后端项目 (Node.js + Express)
│   ├── routes/              # API 路由
│   │   └── admin/
│   │       ├── videos.js
│   │       ├── knowledge_cards.js
│   │       └── ...
│   ├── models/              # 数据模型 (Sequelize)
│   │   ├── Video.js
│   │   ├── KnowledgeCard.js
│   │   └── ...
│   ├── utils/               # 工具函数
│   │   ├── upload-service.js
│   │   └── video-processor.js
│   ├── config/              # 配置文件
│   │   └── config.json
│   └── public/              # 静态文件
│       └── uploads/         # 上传文件目录
│
├── deploy.sh                 # 一键部署脚本
├── DEPLOYMENT.md            # 详细部署文档
└── README.md                # 项目说明
```

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **构建工具**: Vite
- **路由**: Vue Router
- **状态管理**: Pinia
- **样式**: CSS3 (原生)

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **ORM**: Sequelize
- **数据库**: MySQL
- **文件上传**: Multer
- **视频处理**: FFmpeg (fluent-ffmpeg)

## 📝 核心功能说明

### 1. 视频上传
- 支持本地文件上传 (MP4, WebM, AVI 等)
- 支持视频 URL 导入
- 自动提取视频元数据 (时长、分辨率)
- 自动生成视频缩略图

### 2. 知识卡片系统
- **时间轴关联**: 卡片绑定到视频时间点
- **弹窗展示**: 播放时自动弹出相关卡片
- **侧边栏显示**: 完整卡片列表展示
- **富文本编辑**: 支持多种内容格式
  - Markdown 文本
  - 数学公式 (LaTeX)
  - 图片插入
  - 外链资源
  - 文本格式化

### 3. 自定义播放器
- 完整播放控制 (播放/暂停、进度条、音量)
- 倍速播放 (0.5x ~ 2x)
- 全屏支持
- 键盘快捷键
- 时间提示和跳转

### 4. 视频库管理
- 网格展示 (每页 9 个视频)
- 搜索功能
- 批量选择和删除
- 视频详情查看
- 缩略图管理

### 5. 缩略图上传
- 手动上传图片 (JPG, PNG, GIF, WebP)
- 自动生成缩略图
- 实时预览
- 文件大小限制 (2MB)

## 🎯 使用场景

- 📚 **在线教育**: 为教学视频添加知识点注释
- 🎓 **课程制作**: 创建交互式视频课程
- 📹 **内容管理**: 组织和管理视频资源库
- 💼 **企业培训**: 制作培训视频并添加重点提示
- 🎬 **视频编辑**: 为视频添加时间轴标注

## 🔧 配置说明

### 数据库配置
编辑 `Backend/config/config.json`:
```json
{
  "development": {
    "username": "your_db_user",
    "password": "your_db_password",
    "database": "video_cube",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "timezone": "+08:00"
  }
}
```

### 环境变量
创建 `Backend/.env`:
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=video_cube
```

### 前端 API 地址
编辑 `Frontend/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // 后端地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

## 📚 API 文档

### 视频管理
- `GET /api/admin/videos` - 获取视频列表
- `GET /api/admin/videos/:id` - 获取视频详情
- `POST /api/admin/videos` - 创建视频记录
- `POST /api/admin/videos/upload` - 上传视频文件
- `POST /api/admin/videos/:id/thumbnail` - 上传/生成缩略图
- `PUT /api/admin/videos/:id` - 更新视频信息
- `DELETE /api/admin/videos/:id` - 删除视频

### 知识卡片
- `GET /api/admin/knowledge_cards` - 获取知识卡片列表
- `GET /api/admin/knowledge_cards/:id` - 获取卡片详情
- `POST /api/admin/knowledge_cards` - 创建知识卡片
- `PUT /api/admin/knowledge_cards/:id` - 更新知识卡片
- `DELETE /api/admin/knowledge_cards/:id` - 删除知识卡片

## 🐛 常见问题

### 视频无法播放
- 检查视频格式是否支持 (推荐 MP4)
- 检查文件路径是否正确
- 查看浏览器控制台错误信息

### 缩略图不显示
- 确认 FFmpeg 已正确安装
- 检查上传目录权限
- 尝试手动上传缩略图

### 数据库连接失败
- 检查 MySQL 服务是否运行
- 验证数据库配置信息
- 确认数据库和用户已创建

更多问题请查看 [DEPLOYMENT.md](DEPLOYMENT.md) 中的故障排除部分。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request!

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👥 作者

- **Your Name** - *Initial work*

## 🙏 致谢

- Vue.js 团队
- Express.js 社区
- FFmpeg 项目
- 所有贡献者

## 📞 联系方式

- 项目主页: https://github.com/yourusername/Video_Cube
- 问题反馈: https://github.com/yourusername/Video_Cube/issues
- 邮箱: your.email@example.com

---

⭐ 如果这个项目对你有帮助,请给个 Star!
