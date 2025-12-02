// 测试视频库API
const axios = require('axios');

async function testVideoLibraryAPI() {
  console.log('='.repeat(60));
  console.log('测试视频库 API');
  console.log('='.repeat(60));
  
  try {
    console.log('\n1. 测试获取视频列表...');
    const response = await axios.get('http://localhost:3000/admin/videos', {
      params: {
        limit: 5,
        offset: 0
      }
    });
    
    console.log('✅ API调用成功!');
    console.log(`状态: ${response.data.status}`);
    console.log(`消息: ${response.data.message}`);
    console.log(`返回字段:`, Object.keys(response.data.data));
    
    if (response.data.data.total !== undefined) {
      console.log(`✅ total 字段存在: ${response.data.data.total}`);
    } else {
      console.log(`❌ 缺少 total 字段!`);
    }
    
    if (response.data.data.videos) {
      console.log(`✅ videos 字段存在，包含 ${response.data.data.videos.length} 个视频`);
      
      if (response.data.data.videos.length > 0) {
        const firstVideo = response.data.data.videos[0];
        console.log('\n第一个视频信息:');
        console.log(`  ID: ${firstVideo.id}`);
        console.log(`  标题: ${firstVideo.title}`);
        console.log(`  视频URL: ${firstVideo.video_url}`);
        console.log(`  缩略图URL: ${firstVideo.thumbnail_url}`);
        console.log(`  时长: ${firstVideo.duration}秒`);
        console.log(`  状态: ${firstVideo.status}`);
        
        // 测试视频URL是否可访问
        console.log('\n2. 测试视频文件是否可访问...');
        const videoUrl = `http://localhost:3000${firstVideo.video_url}`;
        console.log(`访问URL: ${videoUrl}`);
        
        try {
          const videoResponse = await axios.head(videoUrl);
          console.log(`✅ 视频文件可访问! (状态码: ${videoResponse.status})`);
          console.log(`文件大小: ${videoResponse.headers['content-length']} 字节`);
          console.log(`内容类型: ${videoResponse.headers['content-type']}`);
        } catch (err) {
          console.log(`❌ 视频文件无法访问: ${err.message}`);
        }
        
        // 测试缩略图URL
        if (firstVideo.thumbnail_url) {
          console.log('\n3. 测试缩略图是否可访问...');
          const thumbnailUrl = `http://localhost:3000${firstVideo.thumbnail_url}`;
          console.log(`访问URL: ${thumbnailUrl}`);
          
          try {
            const thumbResponse = await axios.head(thumbnailUrl);
            console.log(`✅ 缩略图可访问! (状态码: ${thumbResponse.status})`);
            console.log(`文件大小: ${thumbResponse.headers['content-length']} 字节`);
            console.log(`内容类型: ${thumbResponse.headers['content-type']}`);
          } catch (err) {
            console.log(`❌ 缩略图无法访问: ${err.message}`);
          }
        }
      }
    } else {
      console.log(`❌ 缺少 videos 字段!`);
    }
    
    // 测试搜索功能
    console.log('\n4. 测试搜索功能...');
    const searchResponse = await axios.get('http://localhost:3000/admin/videos', {
      params: {
        keyword: 'Desktop',
        limit: 3
      }
    });
    console.log(`✅ 搜索成功，找到 ${searchResponse.data.data.videos.length} 个结果`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有测试通过!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`错误信息:`, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ 无法连接到后端服务器 (http://localhost:3000)');
      console.error('请确保后端服务器正在运行: cd Backend && npm start');
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testVideoLibraryAPI();
