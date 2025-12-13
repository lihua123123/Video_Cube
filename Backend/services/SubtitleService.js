/**
 * 字幕生成服务
 * 整合 VideoSubtitleGenerator 功能到主项目
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');

// 设置 ffmpeg 路径
ffmpeg.setFfmpegPath(ffmpegPath.path);

class SubtitleService {
  constructor() {
    // Whisper 配置
    this.whisperModel = process.env.WHISPER_MODEL || 'base.en';
    this.whisperPath = this.getWhisperPath();
    this.modelsDir = path.join(process.cwd(), 'VideoSubtitleGenerator', 'whisper.cpp', 'models');
    
    // 字幕配置
    this.subtitleFormats = ['srt', 'vtt', 'ass'];
    this.sourceLanguage = process.env.SUBTITLE_SOURCE_LANG || 'en';
    this.targetLanguage = process.env.SUBTITLE_TARGET_LANG || 'zh';
  }

  /**
   * 获取 Whisper 可执行文件路径
   */
  getWhisperPath() {
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      return path.join(process.cwd(), 'VideoSubtitleGenerator', 'whisper-bin-x64', 'main.exe');
    }
    return path.join(process.cwd(), 'VideoSubtitleGenerator', 'whisper.cpp', 'main');
  }

  /**
   * 从视频中提取音频
   * @param {string} videoPath - 视频文件路径
   * @param {string} audioPath - 输出音频路径
   */
  async extractAudio(videoPath, audioPath) {
    return new Promise((resolve, reject) => {
      console.log('🎵 开始提取音频:', videoPath);
      
      ffmpeg(videoPath)
        .toFormat('wav')
        .audioFrequency(16000) // 16kHz 采样率
        .audioChannels(1) // 单声道
        .audioCodec('pcm_s16le')
        .on('end', () => {
          console.log('✅ 音频提取完成:', audioPath);
          resolve(audioPath);
        })
        .on('error', (err) => {
          console.error('❌ 音频提取失败:', err);
          reject(err);
        })
        .save(audioPath);
    });
  }

  /**
   * 使用 Whisper 生成字幕
   * @param {string} audioPath - 音频文件路径
   * @param {string} outputPath - 输出字幕路径（不含扩展名）
   * @param {string} language - 语言代码
   */
  async generateSubtitle(audioPath, outputPath, language = 'en') {
    try {
      console.log('🎤 开始语音识别...');
      console.log('📝 模型:', this.whisperModel);
      console.log('🌐 语言:', language);

      const modelPath = path.join(this.modelsDir, `ggml-${this.whisperModel}.bin`);
      
      // 检查模型文件是否存在
      try {
        await fs.access(modelPath);
      } catch (err) {
        throw new Error(`Whisper 模型文件不存在: ${modelPath}`);
      }

      // 执行 Whisper 命令
      const command = `"${this.whisperPath}" -m "${modelPath}" -f "${audioPath}" -osrt -of "${outputPath}" -l ${language}`;
      
      console.log('🚀 执行命令:', command);
      execSync(command, { stdio: 'inherit' });

      console.log('✅ 字幕生成完成');
      return `${outputPath}.srt`;
    } catch (err) {
      console.error('❌ 字幕生成失败:', err);
      throw err;
    }
  }

  /**
   * 解析 SRT 字幕文件
   * @param {string} srtPath - SRT 文件路径
   * @returns {Array} 字幕段落数组
   */
  async parseSRT(srtPath) {
    try {
      const content = await fs.readFile(srtPath, 'utf-8');
      const blocks = content.trim().split('\n\n');
      
      const subtitles = blocks.map((block) => {
        const lines = block.split('\n');
        if (lines.length < 3) return null;

        const index = parseInt(lines[0]);
        const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        
        if (!timeMatch) return null;

        const startTime = this.timeToSeconds(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
        const endTime = this.timeToSeconds(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
        const text = lines.slice(2).join('\n');

        return {
          index,
          startTime,
          endTime,
          text: text.trim(),
          duration: endTime - startTime
        };
      }).filter(Boolean);

      return subtitles;
    } catch (err) {
      console.error('❌ 解析 SRT 失败:', err);
      throw err;
    }
  }

  /**
   * 时间转换为秒
   */
  timeToSeconds(hours, minutes, seconds, milliseconds) {
    return parseInt(hours) * 3600 + 
           parseInt(minutes) * 60 + 
           parseInt(seconds) + 
           parseInt(milliseconds) / 1000;
  }

  /**
   * 秒转换为 SRT 时间格式
   */
  secondsToSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  /**
   * 将 SRT 转换为 VTT 格式
   */
  async convertSRTtoVTT(srtPath, vttPath) {
    try {
      const content = await fs.readFile(srtPath, 'utf-8');
      const vttContent = 'WEBVTT\n\n' + content.replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4');
      await fs.writeFile(vttPath, vttContent, 'utf-8');
      console.log('✅ VTT 转换完成:', vttPath);
      return vttPath;
    } catch (err) {
      console.error('❌ VTT 转换失败:', err);
      throw err;
    }
  }

  /**
   * 优化字幕：断句、去除停顿词等
   * @param {Array} subtitles - 字幕数组
   */
  optimizeSubtitles(subtitles) {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically'];
    
    return subtitles.map(subtitle => {
      let text = subtitle.text;
      
      // 去除停顿词（可选）
      if (process.env.REMOVE_FILLER_WORDS === 'true') {
        fillerWords.forEach(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          text = text.replace(regex, '');
        });
      }

      // 清理多余空格
      text = text.replace(/\s+/g, ' ').trim();

      // 自动添加标点符号（简单规则）
      if (text && !text.match(/[.!?]$/)) {
        text += '.';
      }

      return {
        ...subtitle,
        text,
        originalText: subtitle.text
      };
    });
  }

  /**
   * 合并短字幕段落
   * @param {Array} subtitles - 字幕数组
   * @param {number} minDuration - 最小时长（秒）
   */
  mergeShortSegments(subtitles, minDuration = 2) {
    const merged = [];
    let current = null;

    for (const subtitle of subtitles) {
      if (!current) {
        current = { ...subtitle };
        continue;
      }

      // 如果当前段落太短，且与下一段时间接近，则合并
      if (current.duration < minDuration && (subtitle.startTime - current.endTime) < 0.5) {
        current.text += ' ' + subtitle.text;
        current.endTime = subtitle.endTime;
        current.duration = current.endTime - current.startTime;
      } else {
        merged.push(current);
        current = { ...subtitle };
      }
    }

    if (current) {
      merged.push(current);
    }

    return merged;
  }

  /**
   * 拆分长句（适配屏幕显示）
   * @param {Array} subtitles - 字幕数组
   * @param {number} maxLength - 最大字符数
   */
  splitLongSegments(subtitles, maxLength = 80) {
    const result = [];

    for (const subtitle of subtitles) {
      if (subtitle.text.length <= maxLength) {
        result.push(subtitle);
        continue;
      }

      // 按句子分割
      const sentences = subtitle.text.match(/[^.!?]+[.!?]+/g) || [subtitle.text];
      const duration = subtitle.duration;
      const segmentCount = Math.ceil(subtitle.text.length / maxLength);
      const segmentDuration = duration / segmentCount;

      let currentTime = subtitle.startTime;
      sentences.forEach((sentence, idx) => {
        result.push({
          index: subtitle.index + idx * 0.1,
          startTime: currentTime,
          endTime: currentTime + segmentDuration,
          text: sentence.trim(),
          duration: segmentDuration
        });
        currentTime += segmentDuration;
      });
    }

    return result;
  }

  /**
   * 将字幕转换为知识卡片格式
   * @param {Array} subtitles - 字幕数组
   * @param {number} videoId - 视频ID
   * @param {object} options - 选项
   */
  convertToKnowledgeCards(subtitles, videoId, options = {}) {
    const {
      groupByTime = 30, // 按时间分组（秒）
      minTextLength = 50, // 最小文本长度
      extractKeywords = true
    } = options;

    const cards = [];
    let currentGroup = [];
    let groupStartTime = 0;

    subtitles.forEach((subtitle, index) => {
      currentGroup.push(subtitle);

      const shouldCreateCard = 
        (subtitle.endTime - groupStartTime >= groupByTime) ||
        (index === subtitles.length - 1);

      if (shouldCreateCard && currentGroup.length > 0) {
        const combinedText = currentGroup.map(s => s.text).join(' ');
        
        if (combinedText.length >= minTextLength) {
          const card = {
            video_id: videoId,
            startTime: currentGroup[0].startTime,
            endTime: currentGroup[currentGroup.length - 1].endTime,
            title: this.generateCardTitle(combinedText),
            content: this.formatCardContent(currentGroup),
            content_type: 'markdown',
            is_ai_generated: true,
            metadata: {
              subtitle_count: currentGroup.length,
              source: 'subtitle_asr'
            }
          };

          // 提取关键词
          if (extractKeywords) {
            card.keywords = this.extractKeywords(combinedText);
          }

          cards.push(card);
        }

        currentGroup = [];
        groupStartTime = subtitle.endTime;
      }
    });

    return cards;
  }

  /**
   * 生成卡片标题
   */
  generateCardTitle(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const firstSentence = sentences[0].trim();
    
    // 限制标题长度
    if (firstSentence.length > 50) {
      return firstSentence.substring(0, 47) + '...';
    }
    
    return firstSentence;
  }

  /**
   * 格式化卡片内容（Markdown）
   */
  formatCardContent(subtitles) {
    let markdown = '';
    
    subtitles.forEach(subtitle => {
      const time = this.formatTimeForDisplay(subtitle.startTime);
      markdown += `**[${time}]** ${subtitle.text}\n\n`;
    });

    return markdown.trim();
  }

  /**
   * 格式化时间显示
   */
  formatTimeForDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * 简单关键词提取（基于词频）
   */
  extractKeywords(text, count = 5) {
    // 移除标点符号，转小写
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // 停用词列表
    const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'will', 'been', 'what', 'when', 'where', 'which', 'their', 'there', 'these', 'those']);

    // 统计词频
    const wordFreq = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // 排序并返回前N个
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word);
  }

  /**
   * 翻译字幕（使用外部API）
   * @param {Array} subtitles - 字幕数组
   * @param {string} targetLang - 目标语言
   */
  async translateSubtitles(subtitles, targetLang = 'zh') {
    // TODO: 集成翻译API（百度、火山引擎、DeepL等）
    console.log('🌐 字幕翻译功能待实现');
    return subtitles;
  }

  /**
   * 完整流程：处理视频生成字幕和知识卡片
   * @param {string} videoPath - 视频文件路径
   * @param {number} videoId - 视频ID
   * @param {object} options - 配置选项
   */
  async processVideo(videoPath, videoId, options = {}) {
    const {
      language = this.sourceLanguage,
      formats = ['srt', 'vtt'],
      createKnowledgeCards = true,
      optimize = true
    } = options;

    const result = {
      videoId,
      videoPath,
      subtitles: [],
      knowledgeCards: [],
      files: {}
    };

    try {
      // 1. 生成临时文件路径
      const fileName = path.basename(videoPath, path.extname(videoPath));
      const tempDir = path.join(process.cwd(), 'Backend', 'temp', 'subtitles', String(videoId));
      await fs.mkdir(tempDir, { recursive: true });

      const audioPath = path.join(tempDir, `${fileName}.wav`);
      const srtPath = path.join(tempDir, fileName);

      // 2. 提取音频
      console.log('📹 步骤 1/5: 提取音频...');
      await this.extractAudio(videoPath, audioPath);

      // 3. 生成字幕
      console.log('🎤 步骤 2/5: 语音识别...');
      const srtFile = await this.generateSubtitle(audioPath, srtPath, language);

      // 4. 解析字幕
      console.log('📝 步骤 3/5: 解析字幕...');
      let subtitles = await this.parseSRT(srtFile);

      // 5. 优化字幕
      if (optimize) {
        console.log('✨ 步骤 4/5: 优化字幕...');
        subtitles = this.optimizeSubtitles(subtitles);
        subtitles = this.mergeShortSegments(subtitles);
        subtitles = this.splitLongSegments(subtitles);
      }

      result.subtitles = subtitles;
      result.files.srt = srtFile;

      // 6. 转换格式
      if (formats.includes('vtt')) {
        const vttPath = srtFile.replace('.srt', '.vtt');
        await this.convertSRTtoVTT(srtFile, vttPath);
        result.files.vtt = vttPath;
      }

      // 7. 生成知识卡片
      if (createKnowledgeCards) {
        console.log('🎴 步骤 5/5: 生成知识卡片...');
        result.knowledgeCards = this.convertToKnowledgeCards(subtitles, videoId);
      }

      // 8. 清理临时音频文件
      await fs.unlink(audioPath).catch(() => {});

      console.log('✅ 视频处理完成!');
      console.log(`   - 字幕段落: ${subtitles.length}`);
      console.log(`   - 知识卡片: ${result.knowledgeCards.length}`);

      return result;
    } catch (err) {
      console.error('❌ 视频处理失败:', err);
      throw err;
    }
  }
}

module.exports = SubtitleService;
