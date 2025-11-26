const axios = require('axios');

async function testVideoAPI() {
  try {
    console.log('测试视频列表 API...\n');
    
    const response = await axios.get('http://localhost:3000/admin/videos', {
      params: { limit: 5 }
    });
    
    console.log('✅ API 调用成功!');
    console.log(`状态: ${response.data.status}`);
    console.log(`消息: ${response.data.message}`);
    console.log(`视频数量: ${response.data.data.videos.length}\n`);
    
    response.data.data.videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   ID: ${video.id}, 时长: ${video.duration}秒`);
      console.log(`   视频: ${video.video_url}`);
      console.log(`   缩略图: ${video.thumbnail_url}\n`);
    });
    
  } catch (error) {
    console.error('❌ API 调用失败:');
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`错误: ${error.response.data.message || error.response.data.error}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('无法连接到后端服务器 (http://localhost:3000)');
      console.error('请确保后端服务器正在运行: cd Backend && npm start');
    } else {
      console.error(error.message);
    }
  }
}

testVideoAPI();
