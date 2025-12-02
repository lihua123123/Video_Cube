// 直接使用models目录中的模型定义，这样可以保持关联关系
const db = require('./models/index');
const { Sequelize } = require('sequelize');
const sequelize = db.sequelize;
const KnowledgeCard = db.KnowledgeCard;
const Video = db.Video;

// 查询知识卡片及其关联的视频信息
async function checkCards() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 使用include关联查询视频信息
    const cards = await KnowledgeCard.findAll({
      order: [['id', 'DESC']],
      limit: 10,
      include: [{
        model: Video,
        as: 'video',
        attributes: ['id', 'title', 'video_url']
      }]
    });
    
    console.log(`找到 ${cards.length} 个知识卡片及其关联的视频信息:`);
    cards.forEach(card => {
      console.log(`\n卡片ID: ${card.id}`);
      console.log(`标题: ${card.title}`);
      console.log(`时间范围: ${card.start_time}s - ${card.end_time}s`);
      console.log(`内容类型: ${card.content_type}`);
      console.log(`是否AI生成: ${card.is_ai_generated ? '是' : '否'}`);
      console.log(`创建时间: ${card.created_at}`);
      
      // 显示关联的视频信息
      if (card.video) {
        console.log(`关联视频信息:`);
        console.log(`  - 视频ID: ${card.video.id}`);
        console.log(`  - 视频标题: ${card.video.title}`);
        console.log(`  - 视频URL: ${card.video.video_url}`);
      } else {
        console.log(`关联视频信息: 未找到关联的视频`);
      }
    });
    
    // 反向查询：先查找视频，然后获取它的所有知识卡片
    console.log('\n\n===== 反向查询：视频及其知识卡片 =====');
    const videos = await Video.findAll({
      limit: 5,
      attributes: ['id', 'title', 'duration', 'video_url'], // 只选择数据库中实际存在的字段
      include: [{
        model: KnowledgeCard,
        as: 'knowledgeCards',
        attributes: ['id', 'title', 'start_time', 'end_time'],
        order: [['start_time', 'ASC']]
      }]
    });
    
    videos.forEach(video => {
      console.log(`\n视频ID: ${video.id}`);
      console.log(`视频标题: ${video.title}`);
      console.log(`视频时长: ${video.duration}秒`);
      console.log(`知识卡片数量: ${video.knowledgeCards ? video.knowledgeCards.length : 0}`);
      
      if (video.knowledgeCards && video.knowledgeCards.length > 0) {
        console.log(`关联的知识卡片:`);
        video.knowledgeCards.forEach(card => {
          console.log(`  - 卡片ID: ${card.id}, 标题: ${card.title}, 时间: ${card.start_time}s`);
        });
      }
    });
    
  } catch (error) {
    console.error('查询知识卡片失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 执行查询
checkCards();