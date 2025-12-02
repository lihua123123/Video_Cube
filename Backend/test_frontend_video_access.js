const axios = require('axios');

async function testFrontendVideoAccess() {
  console.log('=== 测试前端视频访问 ===\n');
  
  // 测试1: 测试 /uploads 路径(应该通过Vite代理)
  const videoPath = '/uploads/videos/afc212d1-c205-465c-a780-24afe6bd44fd.mp4';
  
  console.log('测试场景1: 直接访问后端 (localhost:3000)');
  try {
    const response1 = await axios.get(`http://localhost:3000${videoPath}`, {
      responseType: 'stream',
      maxRedirects: 0
    });
    console.log('✅ 后端可访问');
    console.log(`   状态码: ${response1.status}`);
    console.log(`   Content-Type: ${response1.headers['content-type']}`);
    console.log(`   Content-Length: ${response1.headers['content-length']}\n`);
  } catch (error) {
    console.log('❌ 后端无法访问');
    console.log(`   错误: ${error.message}\n`);
  }
  
  console.log('测试场景2: 通过前端开发服务器访问 (localhost:5173)');
  console.log('注意: 这需要前端服务器正在运行');
  try {
    const response2 = await axios.get(`http://localhost:5173${videoPath}`, {
      responseType: 'stream',
      maxRedirects: 5,
      validateStatus: () => true
    });
    
    if (response2.status === 200) {
      console.log('✅ 前端代理可访问');
      console.log(`   状态码: ${response2.status}`);
      console.log(`   Content-Type: ${response2.headers['content-type']}`);
      console.log(`   Content-Length: ${response2.headers['content-length']}\n`);
    } else {
      console.log('❌ 前端代理返回错误');
      console.log(`   状态码: ${response2.status}`);
      console.log(`   响应: ${response2.statusText}\n`);
    }
  } catch (error) {
    console.log('❌ 前端服务器无法访问');
    console.log(`   错误: ${error.message}`);
    console.log('   提示: 请确保前端开发服务器正在运行 (npm run dev)\n');
  }
  
  console.log('=== 检查总结 ===');
  console.log('如果场景1成功但场景2失败,说明Vite代理配置有问题');
  console.log('如果两者都失败,说明视频文件不存在或后端配置有问题');
  console.log('\n解决方案:');
  console.log('1. 确保前端开发服务器已重启 (cd Frontend && npm run dev)');
  console.log('2. 确保 vite.config.ts 中包含 /uploads 代理配置');
  console.log('3. 清除浏览器缓存并刷新页面');
}

testFrontendVideoAccess();
