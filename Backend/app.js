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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// 添加静态文件服务，允许访问上传的视频和缩略图
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin/videos', adminVideosRouter);
app.use('/admin/knowledge_cards', adminKnowledgeCardsRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin/video_segments', adminVideoSegmentsRouter);
app.use('/admin/ai_analysis_tasks', adminAiAnalysisTasksRouter);

module.exports = app;
