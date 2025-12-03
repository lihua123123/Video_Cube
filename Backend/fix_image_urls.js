/**
 * 修复数据库中旧的图片URL
 * 将 http://localhost:5173/uploads/ 替换为 http://localhost:3000/uploads/
 */

const { KnowledgeCard } = require('./models');
const { Op } = require('sequelize');

async function fixImageUrls() {
  try {
    console.log('🔍 开始检查需要修复的知识卡片...');
    
    // 查找所有包含旧URL的知识卡片
    const cardsWithOldUrls = await KnowledgeCard.findAll({
      where: {
        content: {
          [Op.like]: '%localhost:5173/uploads/%'
        }
      }
    });
    
    console.log(`📊 找到 ${cardsWithOldUrls.length} 个需要修复的知识卡片`);
    
    if (cardsWithOldUrls.length === 0) {
      console.log('✅ 没有需要修复的数据');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const card of cardsWithOldUrls) {
      try {
        const oldContent = card.content;
        // 替换所有 localhost:5173 为 localhost:3000
        const newContent = oldContent.replace(
          /http:\/\/localhost:5173\/uploads\//g,
          'http://localhost:3000/uploads/'
        );
        
        if (oldContent !== newContent) {
          await card.update({ content: newContent });
          console.log(`✅ 修复卡片 #${card.id}: ${card.title}`);
          
          // 显示修改的URL
          const oldUrls = oldContent.match(/http:\/\/localhost:5173\/uploads\/[^\s)"]*/g) || [];
          const newUrls = newContent.match(/http:\/\/localhost:3000\/uploads\/[^\s)"]*/g) || [];
          console.log(`   旧URL数量: ${oldUrls.length}`);
          if (oldUrls.length > 0) {
            console.log(`   示例: ${oldUrls[0]}`);
            console.log(`      → ${newUrls[0]}`);
          }
          
          successCount++;
        }
      } catch (error) {
        console.error(`❌ 修复卡片 #${card.id} 失败:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 修复统计:');
    console.log(`   ✅ 成功: ${successCount}`);
    console.log(`   ❌ 失败: ${errorCount}`);
    console.log(`   📝 总计: ${cardsWithOldUrls.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 修复完成!刷新浏览器后图片应该可以正常显示了');
    }
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error);
  } finally {
    process.exit(0);
  }
}

// 执行修复
console.log('🚀 图片URL修复工具');
console.log('=' .repeat(50));
fixImageUrls();
