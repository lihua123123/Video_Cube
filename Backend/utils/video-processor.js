const ffmpegService = require('./ffmpeg-service');
const uploadService = require('./upload-service');
const path = require('path');
const fs = require('fs');

class VideoProcessor {
  /**
   * 处理上传的视频文件
   * @param {Object} file - 上传的文件对象
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} 处理结果
   */
  async processUploadedVideo(file, options = {}) {
    try {
      console.log(`开始处理上传视频: ${file.originalname}`);
      
      // 构建完整的视频路径
      const videoPath = uploadService.getLocalFilePath(file.filename, 'video');
      // 确保使用绝对路径以支持中文文件名
      const absoluteVideoPath = path.resolve(videoPath);
      console.log(`使用绝对路径: ${absoluteVideoPath}`);
      
      // 默认选项
      const {
        generateThumbnail = false, // 开发环境先禁用缩略图生成
        transcode = false,
        thumbnailOptions = {},
        transcodeOptions = {}
      } = options;
      
      // 构建结果对象
      const result = {
        originalFileName: file.originalname,
        storedFileName: file.filename,
        videoPath: uploadService.getPublicFilePath(file.filename, 'video'),
        localVideoPath: videoPath,
        absoluteVideoPath: absoluteVideoPath,
        fileSize: file.size,
        // 初始为空，稍后尝试填充
        videoInfo: null
      };
      
      // 尝试获取视频信息，但不阻止上传
      try {
        result.videoInfo = await ffmpegService.getVideoInfo(absoluteVideoPath);
      } catch (ffmpegError) {
        console.warn('无法获取视频信息（FFmpeg可能未安装）:', ffmpegError.message);
        // 提供基本信息作为替代
        result.videoInfo = {
          duration: 0,
          size: file.size,
          format: path.extname(file.filename).slice(1),
          video: null,
          audio: null,
          ffmpegMissing: true
        };
      }
      
      // 尝试生成缩略图，但不阻止上传
      if (generateThumbnail) {
        try {
          const thumbnailFileName = this.generateThumbnailFileName(file.filename);
          const thumbnailPath = uploadService.getLocalFilePath(thumbnailFileName, 'thumbnail');
          // 确保使用绝对路径以支持中文文件名
          const absoluteThumbnailPath = path.resolve(thumbnailPath);
          
          // 确保缩略图目录存在
          const thumbnailDir = path.dirname(absoluteThumbnailPath);
          if (!fs.existsSync(thumbnailDir)) {
            fs.mkdirSync(thumbnailDir, { recursive: true });
          }
          
          console.log(`生成缩略图: ${absoluteThumbnailPath}`);
          await ffmpegService.generateThumbnail(absoluteVideoPath, absoluteThumbnailPath, thumbnailOptions);
          
          result.thumbnailPath = uploadService.getPublicFilePath(thumbnailFileName, 'thumbnail');
          result.localThumbnailPath = thumbnailPath;
          result.absoluteThumbnailPath = absoluteThumbnailPath;
        } catch (thumbnailError) {
          console.warn('无法生成缩略图（FFmpeg可能未安装）:', thumbnailError.message);
          result.thumbnailPath = null;
          result.localThumbnailPath = null;
        }
      }
      
      // 尝试视频转码，但不阻止上传
      if (transcode) {
        try {
          const transcodedFileName = this.generateTranscodedFileName(file.filename);
          const transcodedPath = uploadService.getLocalFilePath(transcodedFileName, 'video');
          // 确保使用绝对路径以支持中文文件名
          const absoluteTranscodedPath = path.resolve(transcodedPath);
          
          // 确保转码目录存在
          const transcodedDir = path.dirname(absoluteTranscodedPath);
          if (!fs.existsSync(transcodedDir)) {
            fs.mkdirSync(transcodedDir, { recursive: true });
          }
          
          console.log(`开始转码视频，输出路径: ${absoluteTranscodedPath}`);
          
          const transcodeResult = await ffmpegService.transcodeVideo(
            absoluteVideoPath, 
            absoluteTranscodedPath, 
            transcodeOptions
          );
          
          result.transcodedPath = uploadService.getPublicFilePath(transcodedFileName, 'video');
          result.localTranscodedPath = transcodedPath;
          result.absoluteTranscodedPath = absoluteTranscodedPath;
          result.transcodeInfo = transcodeResult;
          console.log(`视频转码成功: ${absoluteTranscodedPath}`);
        } catch (transcodeError) {
          console.warn('无法转码视频（FFmpeg可能未安装或路径权限问题）:', transcodeError.message);
        }
      }
      
      return result;
    } catch (error) {
      // 如果处理失败，清理已上传的文件
      try {
        if (file && file.filename) {
          await uploadService.deleteFile(file.filename, 'video');
        }
      } catch (cleanupError) {
        console.error('清理失败的上传文件时出错:', cleanupError);
      }
      
      throw error;
    }
  }
  
  /**
   * 为已存在的视频生成缩略图
   * @param {string} videoFileName - 视频文件名
   * @param {Object} options - 缩略图选项
   * @returns {Promise<Object>} 缩略图信息
   */
  async generateThumbnailForExistingVideo(videoFileName, options = {}) {
    const videoPath = uploadService.getLocalFilePath(videoFileName, 'video');
    // 确保使用绝对路径以支持中文文件名
    const absoluteVideoPath = path.resolve(videoPath);
    
    console.log(`为视频生成缩略图: ${absoluteVideoPath}`);
    
    // 检查视频文件是否存在
    if (!fs.existsSync(absoluteVideoPath)) {
      throw new Error(`视频文件不存在: ${absoluteVideoPath}`);
    }
    
    const thumbnailFileName = this.generateThumbnailFileName(videoFileName);
    const thumbnailPath = uploadService.getLocalFilePath(thumbnailFileName, 'thumbnail');
    // 确保使用绝对路径以支持中文文件名
    const absoluteThumbnailPath = path.resolve(thumbnailPath);
    
    // 确保缩略图目录存在
    const thumbnailDir = path.dirname(absoluteThumbnailPath);
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }
    
    await ffmpegService.generateThumbnail(absoluteVideoPath, absoluteThumbnailPath, options);
    
    return {
      thumbnailPath: uploadService.getPublicFilePath(thumbnailFileName, 'thumbnail'),
      localThumbnailPath: thumbnailPath,
      thumbnailFileName
    };
  }
  
  /**
   * 转码已存在的视频
   * @param {string} videoFileName - 视频文件名
   * @param {Object} options - 转码选项
   * @returns {Promise<Object>} 转码结果
   */
  async transcodeExistingVideo(videoFileName, options = {}) {
    const videoPath = uploadService.getLocalFilePath(videoFileName, 'video');
    // 确保使用绝对路径以支持中文文件名
    const absoluteVideoPath = path.resolve(videoPath);
    
    console.log(`开始转码视频: ${absoluteVideoPath}`);
    
    // 检查视频文件是否存在
    if (!fs.existsSync(absoluteVideoPath)) {
      throw new Error(`视频文件不存在: ${absoluteVideoPath}`);
    }
    
    const transcodedFileName = this.generateTranscodedFileName(videoFileName);
    const transcodedPath = uploadService.getLocalFilePath(transcodedFileName, 'video');
    // 确保使用绝对路径以支持中文文件名
    const absoluteTranscodedPath = path.resolve(transcodedPath);
    
    // 确保转码目录存在
    const transcodedDir = path.dirname(absoluteTranscodedPath);
    if (!fs.existsSync(transcodedDir)) {
      fs.mkdirSync(transcodedDir, { recursive: true });
    }
    
    console.log(`转码输出路径: ${absoluteTranscodedPath}`);
    
    const transcodeResult = await ffmpegService.transcodeVideo(
      absoluteVideoPath, 
      absoluteTranscodedPath, 
      options
    );
    
    console.log(`视频转码成功: ${absoluteTranscodedPath}`);
    
    return {
      transcodedPath: uploadService.getPublicFilePath(transcodedFileName, 'video'),
      localTranscodedPath: transcodedPath,
      transcodedFileName,
      transcodeInfo: transcodeResult
    };
  }
  
  /**
   * 获取视频统计信息
   * @param {string} videoFileName - 视频文件名
   * @returns {Promise<Object>} 视频统计信息
   */
  async getVideoStatistics(videoFileName) {
    const videoPath = uploadService.getLocalFilePath(videoFileName, 'video');
    // 确保使用绝对路径以支持中文文件名
    const absoluteVideoPath = path.resolve(videoPath);
    
    console.log(`获取视频统计信息: ${absoluteVideoPath}`);
    
    // 检查视频文件是否存在
    if (!fs.existsSync(absoluteVideoPath)) {
      throw new Error(`视频文件不存在: ${absoluteVideoPath}`);
    }
    
    const info = await ffmpegService.getVideoInfo(absoluteVideoPath);
    const stats = fs.statSync(videoPath);
    
    return {
      ...info,
      fileSize: stats.size,
      fileSizeFormatted: this.formatFileSize(stats.size),
      durationFormatted: this.formatDuration(info.duration),
      resolution: info.video ? `${info.video.width}x${info.video.height}` : null
    };
  }
  
  /**
   * 生成缩略图文件名
   * @param {string} videoFileName - 视频文件名
   * @returns {string} 缩略图文件名
   */
  generateThumbnailFileName(videoFileName) {
    const nameWithoutExt = path.basename(videoFileName, path.extname(videoFileName));
    // 确保文件名处理不会导致编码问题
    return `${nameWithoutExt}_thumbnail.jpg`;
  }
  
  /**
   * 生成转码后的文件名
   * @param {string} videoFileName - 视频文件名
   * @returns {string} 转码后的文件名
   */
  generateTranscodedFileName(videoFileName) {
    const nameWithoutExt = path.basename(videoFileName, path.extname(videoFileName));
    // 确保文件名处理不会导致编码问题
    return `${nameWithoutExt}_transcoded.mp4`;
  }
  
  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 格式化时长
   * @param {number} seconds - 秒数
   * @returns {string} 格式化后的时长 (HH:MM:SS)
   */
  formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  }
  
  /**
   * 批量处理视频
   * @param {Array<Object>} files - 文件对象数组
   * @param {Object} options - 处理选项
   * @returns {Promise<Array<Object>>} 处理结果数组
   */
  async batchProcessVideos(files, options = {}) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.processUploadedVideo(files[i], options);
        results.push({
          index: i,
          success: true,
          data: result
        });
      } catch (error) {
        errors.push({
          index: i,
          originalFileName: files[i].originalname,
          error: error.message
        });
        
        results.push({
          index: i,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: errors.length,
      results,
      errors
    };
  }
}

module.exports = new VideoProcessor();