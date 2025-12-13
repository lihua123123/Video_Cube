var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const adminVideosRouter = require('./routes/admin/videos');
const adminKnowledgeCardsRouter = require('./routes/admin/knowledge_cards');
const adminVideoSegmentsRouter = require('./routes/admin/video_segment');
const adminAiAnalysisTasksRouter = require('./routes/admin/ai_analysis_tasks');
const subtitlesRouter = require('./routes/subtitles');

var app = express();

// 数据库连接
const db = require('./models');
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// CORS 配置 - 允许前端访问后端资源
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// 添加静态文件服务，允许访问上传的视频、缩略图和图片  
// 优先使用 public/uploads 目录（新的上传位置，包含images）
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// 兼容旧的 uploads 目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin/videos', adminVideosRouter);
app.use('/admin/knowledge_cards', adminKnowledgeCardsRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
// 支持两种URL格式: video-segments (推荐的REST风格) 和 video_segments (向后兼容)
app.use('/admin/video-segments', adminVideoSegmentsRouter);
app.use('/admin/video_segments', adminVideoSegmentsRouter);
app.use('/admin/ai_analysis_tasks', adminAiAnalysisTasksRouter);
app.use('/admin/subtitles', subtitlesRouter);

module.exports = app;
