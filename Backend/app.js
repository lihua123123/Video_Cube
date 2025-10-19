var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const adminVideosRouter = require('./routes/admin/videos');
const adminKnowledgeCardsRouter = require('./routes/admin/knowledge_cards');

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
app.use('/admin/videos', adminVideosRouter);
app.use('/admin/knowledge_cards', adminKnowledgeCardsRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
