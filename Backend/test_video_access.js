const axios = require('axios');

async function testVideoAccess() {
  const videoUrl = '/uploads/videos/afc212d1-c205-465c-a780-24afe6bd44fd.mp4';
  
  try {
    console.log('测试视频访问:');
    console.log(`URL: http://localhost:3000${videoUrl}\n`);
    
    const response = await axios.get(`http://localhost:3000${videoUrl}`, {
      responseType: 'stream',
      maxRedirects: 0
    });
    
    console.log('✅ 视频文件可以访问!');
    console.log(`状态码: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.headers['content-length']}`);
    
  } catch (error) {
    console.log('❌ 视频文件无法访问');
    console.log(`错误: ${error.message}`);
    if (error.response) {
      console.log(`状态码: ${error.response.status}`);
      console.log(`响应: ${error.response.statusText}`);
    }
  }
}

testVideoAccess();
