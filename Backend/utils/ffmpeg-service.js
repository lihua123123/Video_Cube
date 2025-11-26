const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

class FFmpegService {
  constructor() {
    // 配置FFmpeg路径，明确指定我们安装的FFmpeg位置
    ffmpeg.setFfmpegPath('D:\\Code\\nodejs\\Video_Cube\\ffmpeg\\extracted\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe');
    ffmpeg.setFfprobePath('D:\\Code\\nodejs\\Video_Cube\\ffmpeg\\extracted\\ffmpeg-master-latest-win64-gpl\\bin\\ffprobe.exe');
  }

  /**
   * 获取视频文件信息
   * @param {string} videoPath - 视频文件路径
   * @returns {Promise<Object>} 视频信息
   */
  getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        
        // 提取有用的视频信息
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        
        resolve({
          duration: metadata.format.duration || 0,
          size: metadata.format.size || 0,
          format: metadata.format.format_name,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            frameRate: eval(videoStream.r_frame_rate) || 0 // 转换分数形式的帧率
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            channels: audioStream.channels,
            sampleRate: audioStream.sample_rate
          } : null
        });
      });
    });
  }

  /**
   * 生成视频缩略图
   * @param {string} videoPath - 视频文件路径
   * @param {string} outputPath - 输出图片路径
   * @param {Object} options - 选项
   * @returns {Promise<string>} 生成的图片路径
   */
  generateThumbnail(videoPath, outputPath, options = {}) {
    const {
      time = '00:00:01', // 默认从第1秒截取
      width = 320,       // 默认宽度
      height = null      // 如果为null，将保持宽高比
    } = options;

    return new Promise((resolve, reject) => {
      const command = ffmpeg(videoPath)
        .screenshots({
          timestamps: [time],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: height ? `${width}x${height}` : `${width}x?`
        })
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err));
    });
  }

  /**
   * 视频转码
   * @param {string} inputPath - 输入视频路径
   * @param {string} outputPath - 输出视频路径
   * @param {Object} options - 转码选项
   * @returns {Promise<Object>} 转码结果
   */
  async transcodeVideo(inputPath, outputPath, options = {}) {
    const {
      videoCodec = 'libx264',
      audioCodec = 'aac',
      videoBitrate = '1M',
      audioBitrate = '128k',
      resolution = null,
      fps = null
    } = options;

    // 确保使用绝对路径，防止相对路径在Windows下可能出现的编码问题
    const absoluteInputPath = path.resolve(inputPath);
    const absoluteOutputPath = path.resolve(outputPath);
    
    // Windows特有的路径处理：确保路径格式正确，避免路径分隔符问题
    const winInputPath = absoluteInputPath.replace(/\//g, '\\');
    const winOutputPath = absoluteOutputPath.replace(/\//g, '\\');
    
    console.log(`开始转码 - 输入: ${winInputPath}`);
    console.log(`输出路径: ${winOutputPath}`);
    
    // 验证输入文件存在
    if (!fs.existsSync(winInputPath)) {
      throw new Error(`输入文件不存在: ${winInputPath}`);
    }
    
    // 确保输出目录存在
    const outputDir = path.dirname(winOutputPath);
    console.log(`输出目录: ${outputDir}`);
    
    try {
      // 创建目录并处理可能的权限问题
      if (!fs.existsSync(outputDir)) {
        console.log(`创建输出目录: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 验证目录可写性
      try {
        const testFilePath = path.join(outputDir, `test_${Date.now()}.tmp`);
        fs.writeFileSync(testFilePath, 'test');
        fs.unlinkSync(testFilePath);
        console.log(`输出目录可写验证成功`);
      } catch (writeError) {
        console.error(`输出目录写入权限验证失败: ${writeError.message}`);
        throw new Error(`无法写入输出目录，可能是权限问题: ${outputDir}`);
      }
    } catch (dirError) {
      console.error(`创建输出目录失败: ${dirError.message}`);
      throw new Error(`无法创建输出目录: ${dirError}`);
    }

    return new Promise((resolve, reject) => {
      try {
        // 使用不同的方法设置输出，尝试使用更兼容Windows的方式
        // 对于Windows系统，我们需要特殊处理路径
        const command = ffmpeg(winInputPath)
          // 使用引号包围路径，避免路径中的空格等特殊字符问题
          .output(winOutputPath)
          .videoCodec(videoCodec)
          .audioCodec(audioCodec)
          // 添加更多Windows系统兼容选项
          .outputOptions([
            '-movflags +faststart',
            '-y', // 覆盖现有文件，避免交互提示
            '-b:v', videoBitrate,  // 使用标准的FFmpeg参数格式指定视频比特率
            '-b:a', audioBitrate   // 使用标准的FFmpeg参数格式指定音频比特率
          ])
          // 禁用可能导致问题的选项
          .noAudio(false); // 确保音频处理不会被意外禁用

        // 设置分辨率
          if (resolution) {
            command.size(resolution);
          }

          // 设置帧率
          if (fps) {
            command.fps(fps);
          }

          let startTime = Date.now();
          let progress = 0;

          command
            // 添加更详细的日志
            .on('start', (commandLine) => {
              console.log(`FFmpeg命令开始执行: ${commandLine}`);
            })
            .on('progress', (data) => {
              if (data.total_duration) {
                progress = Math.floor((data.seconds / data.total_duration) * 100);
                console.log(`转码进度: ${progress}%`);
              }
            })
            .on('end', async () => {
              const duration = (Date.now() - startTime) / 1000;
              console.log(`转码完成，耗时: ${duration}秒`);
              // 验证输出文件是否创建成功
              if (fs.existsSync(winOutputPath)) {
                const stats = fs.statSync(winOutputPath);
                console.log(`输出文件大小: ${stats.size} 字节`);
                resolve({
                  outputPath,
                  duration,
                  progress: 100,
                  fileSize: stats.size
                });
              } else {
                throw new Error(`转码命令完成但未生成输出文件: ${winOutputPath}`);
              }
            })
            .on('error', (err, stdout, stderr) => {
              console.error(`转码错误详情: ${err.message}`);
              console.error(`FFmpeg输出: ${stdout}`);
              console.error(`FFmpeg错误输出: ${stderr}`);
              // 尝试提供更明确的错误信息
              if (err.message.includes('Invalid argument')) {
                reject(new Error(`转码失败 - 输出路径可能有问题: ${winOutputPath}`));
              } else if (err.message.includes('Error opening output file')) {
                reject(new Error(`转码失败 - 无法打开输出文件，可能是权限问题或路径格式错误: ${winOutputPath}`));
              } else {
                reject(err);
              }
            });

        command.run();
      } catch (setupError) {
        console.error(`转码设置错误: ${setupError.message}`);
        reject(setupError);
      }
    });
  }

  /**
   * 提取视频中的音频
   * @param {string} videoPath - 视频文件路径
   * @param {string} audioPath - 输出音频路径
   * @returns {Promise<string>} 输出音频路径
   */
  extractAudio(videoPath, audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .noVideo()
        .audioCodec('aac')
        .on('end', () => resolve(audioPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  /**
   * 检查文件是否为有效的视频文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否为有效的视频文件
   */
  async isVideoFile(filePath) {
    try {
      const metadata = await this.getVideoInfo(filePath);
      return metadata.video !== null;
    } catch (error) {
      console.error('检查视频文件失败:', error);
      return false;
    }
  }
}

module.exports = new FFmpegService();