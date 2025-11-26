const axios = require('axios');

async function testApiResponse() {
  console.log('=== 测试API返回数据 ===\n');
  
  try {
    const response = await axios.get('http://localhost:3000/admin/videos', {
      params: {
        limit: 8,
        offset: 0
      }
    });
    
    console.log('✅ API 响应成功');
    console.log('状态码:', response.status);
    console.log('\n返回的数据结构:');
    console.log('status:', response.data.status);
    console.log('message:', response.data.message);
    console.log('视频总数:', response.data.data.total);
    console.log('返回视频数:', response.data.data.videos.length);
    
    console.log('\n第一个视频的完整数据:');
    if (response.data.data.videos.length > 0) {
      const firstVideo = response.data.data.videos[0];
      console.log('ID:', firstVideo.id);
      console.log('标题:', firstVideo.title);
      console.log('描述:', firstVideo.description);
      console.log('视频URL:', firstVideo.video_url);
      console.log('缩略图URL:', firstVideo.thumbnail_url);
      console.log('时长(秒):', firstVideo.duration);
      console.log('状态:', firstVideo.status);
      console.log('创建时间:', firstVideo.created_at);
      console.log('更新时间:', firstVideo.updated_at);
      
      console.log('\n所有字段:');
      console.log(JSON.stringify(firstVideo, null, 2));
    }
  } catch (error) {
    console.error('❌ API请求失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testApiResponse().catch(console.error);
