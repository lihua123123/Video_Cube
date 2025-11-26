const axios = require('axios');

async function debugVideoPlayback() {
  console.log('=== 调试视频播放问题 ===\n');
  
  // 测试视频文件
  const testVideoId = 'afc212d1-c205-465c-a780-24afe6bd44fd';
  const videoPath = `/uploads/videos/${testVideoId}.mp4`;
  
  console.log('测试1: 直接访问后端');
  console.log(`URL: http://localhost:3000${videoPath}`);
  try {
    const response1 = await axios.head(`http://localhost:3000${videoPath}`);
    console.log(`✅ 状态码: ${response1.status}`);
    console.log(`   Content-Type: ${response1.headers['content-type']}`);
    console.log(`   Content-Length: ${response1.headers['content-length']}\n`);
  } catch (error) {
    console.log(`❌ 错误: ${error.message}\n`);
  }
  
  console.log('测试2: 通过前端 /api 代理');
  console.log(`URL: http://localhost:5173/api${videoPath}`);
  try {
    const response2 = await axios.head(`http://localhost:5173/api${videoPath}`, {
      maxRedirects: 5
    });
    console.log(`✅ 状态码: ${response2.status}`);
    console.log(`   Content-Type: ${response2.headers['content-type']}`);
    console.log(`   Content-Length: ${response2.headers['content-length']}\n`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 无法连接到前端服务器 (localhost:5173)');
      console.log('   请确保运行: cd Frontend && npm run dev\n');
    } else {
      console.log(`❌ 错误: ${error.message}\n`);
    }
  }
  
  console.log('测试3: 检查文件是否真实存在');
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'public', 'uploads', 'videos', `${testVideoId}.mp4`);
  console.log(`文件路径: ${filePath}`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ 文件存在`);
    console.log(`   大小: ${stats.size} 字节 (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n`);
  } else {
    console.log(`❌ 文件不存在\n`);
  }
  
  console.log('=== 诊断建议 ===');
  console.log('如果测试1成功:');
  console.log('  ✅ 后端静态文件服务工作正常');
  console.log('\n如果测试2失败:');
  console.log('  1. 检查前端是否运行 (npm run dev)');
  console.log('  2. 检查 vite.config.ts 中的代理配置');
  console.log('  3. 重启前端服务器');
  console.log('\n如果测试3失败:');
  console.log('  ❌ 视频文件丢失,需要重新上传');
}

debugVideoPlayback().catch(console.error);
