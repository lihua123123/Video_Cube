/**
 * 字幕生成功能测试脚本
 * 用法: node test-subtitle.js <video_id>
 */

import SubtitleService from './services/SubtitleService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSubtitleGeneration() {
  const videoId = process.argv[2] || 35;
  
  console.log('🎬 字幕生成测试');
  console.log('================\n');
  
  // 测试视频路径（请修改为实际路径）
  const videoPath = path.join(__dirname, 'public', 'uploads', 'videos', 'test-video.mp4');
  
  console.log(`📹 视频ID: ${videoId}`);
  console.log(`📂 视频路径: ${videoPath}\n`);

  const subtitleService = new SubtitleService();

  try {
    console.log('🚀 开始处理...\n');
    
    const result = await subtitleService.processVideo(videoPath, videoId, {
      language: 'en',
      formats: ['srt', 'vtt'],
      createKnowledgeCards: true,
      optimize: true
    });

    console.log('\n✅ 处理完成!');
    console.log('================');
    console.log(`📝 字幕段落: ${result.subtitles.length}`);
    console.log(`🎴 知识卡片: ${result.knowledgeCards.length}`);
    console.log(`📁 SRT文件: ${result.files.srt}`);
    console.log(`📁 VTT文件: ${result.files.vtt || '未生成'}`);
    
    console.log('\n📋 前 5 条字幕:');
    result.subtitles.slice(0, 5).forEach((subtitle, idx) => {
      console.log(`\n${idx + 1}. [${subtitle.startTime.toFixed(1)}s - ${subtitle.endTime.toFixed(1)}s]`);
      console.log(`   ${subtitle.text}`);
    });

    if (result.knowledgeCards.length > 0) {
      console.log('\n🎴 生成的知识卡片:');
      result.knowledgeCards.forEach((card, idx) => {
        console.log(`\n${idx + 1}. ${card.title}`);
        console.log(`   时间: ${card.startTime}s - ${card.endTime}s`);
        console.log(`   关键词: ${card.keywords?.join(', ') || '无'}`);
      });
    }

  } catch (err) {
    console.error('\n❌ 测试失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// 运行测试
testSubtitleGeneration().then(() => {
  console.log('\n✨ 测试完成');
  process.exit(0);
});
