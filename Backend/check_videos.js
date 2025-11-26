const db = require('./models');

async function checkVideos() {
  try {
    await db.sequelize.authenticate();
    console.log('数据库连接成功');
    
    const videos = await db.Video.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log('='.repeat(50));
    console.log(`数据库中的视频总数: ${videos.length}`);
    console.log('='.repeat(50));
    
    if (videos.length === 0) {
      console.log('❌ 数据库中没有任何视频记录!');
    } else {
      videos.forEach((v, i) => {
        console.log(`\n${i + 1}. 视频记录:`);
        console.log(`   ID: ${v.id}`);
        console.log(`   标题: ${v.title}`);
        console.log(`   描述: ${v.description || '无'}`);
        console.log(`   视频URL: ${v.video_url}`);
        console.log(`   缩略图URL: ${v.thumbnail_url || '无'}`);
        console.log(`   时长: ${v.duration}秒`);
        console.log(`   状态: ${v.status}`);
        console.log(`   创建时间: ${v.createdAt}`);
        console.log(`   更新时间: ${v.updatedAt}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

checkVideos();
