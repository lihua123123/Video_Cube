const axios = require('axios');

async function testApiUploadPath() {
  console.log('=== 测试 /api/uploads 代理路径 ===\n');
  
  const videoPath = '/api/uploads/videos/afc212d1-c205-465c-a780-24afe6bd44fd.mp4';
  
  console.log('测试: 通过前端 /api 代理访问视频');
  console.log(`URL: http://localhost:5173${videoPath}\n`);
  
  try {
    const response = await axios.get(`http://localhost:5173${videoPath}`, {
      responseType: 'stream',
      maxRedirects: 5,
      validateStatus: () => true,
      maxContentLength: 100000000,
      timeout: 10000
    });
    
    console.log(`状态码: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.headers['content-length']}`);
    
    if (response.status === 200 && response.headers['content-type'].includes('video')) {
      console.log('\n✅ 成功! /api 代理可以正确访问视频文件');
      console.log('   这意味着在 UserPage 中使用 `/api${video.video_url}` 是正确的');
    } else if (response.status === 200) {
      console.log('\n⚠️ 警告: 状态码200但返回的不是视频文件');
      console.log(`   返回的是: ${response.headers['content-type']}`);
      console.log('   可能是返回了HTML页面而不是视频');
    } else {
      console.log(`\n❌ 失败: HTTP ${response.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 无法连接到前端服务器');
      console.log('   请确保前端开发服务器正在运行:');
      console.log('   cd Frontend && npm run dev');
    } else {
      console.log(`❌ 错误: ${error.message}`);
    }
  }
  
  console.log('\n=== Vite 代理工作原理 ===');
  console.log('请求: http://localhost:5173/api/uploads/videos/xxx.mp4');
  console.log('↓');
  console.log('Vite /api 代理接收请求');
  console.log('↓');
  console.log('rewrite: /api/uploads/videos/xxx.mp4 → /uploads/videos/xxx.mp4');
  console.log('↓');
  console.log('转发到: http://localhost:3000/uploads/videos/xxx.mp4');
  console.log('↓');
  console.log('Express 静态文件服务 (public 目录)');
  console.log('↓');
  console.log('返回文件: public/uploads/videos/xxx.mp4');
}

testApiUploadPath();
