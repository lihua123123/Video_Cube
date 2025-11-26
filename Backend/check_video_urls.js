const db = require('./models');

async function checkVideoUrls() {
  try {
    await db.sequelize.authenticate();
    console.log('数据库连接成功\n');
    
    const videos = await db.Video.findAll({
      limit: 10,
      order: [['id', 'DESC']]
    });
    
    console.log(`找到 ${videos.length} 个视频记录:\n`);
    
    videos.forEach(video => {
      console.log(`ID: ${video.id}`);
      console.log(`标题: ${video.title}`);
      console.log(`视频路径: ${video.video_url}`);
      console.log(`缩略图路径: ${video.thumbnail_url}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkVideoUrls();
