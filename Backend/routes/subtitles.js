/**
 * 字幕生成与管理路由
 */

const express = require('express');
const SubtitleService = require('../services/SubtitleService');
const { Video, KnowledgeCard } = require('../models');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();
const subtitleService = new SubtitleService();

/**
 * POST /admin/subtitles/generate
 * 为指定视频生成字幕
 */
router.post('/generate', async (req, res) => {
  try {
    const { video_id, language = 'en', formats = ['srt', 'vtt'], create_cards = true } = req.body;

    if (!video_id) {
      return res.status(400).json({ error: '缺少 video_id 参数' });
    }

    // 查询视频信息
    const video = await Video.findByPk(video_id);
    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    // 检查视频文件是否存在
    const videoPath = path.join(process.cwd(), 'Backend', video.file_path || video.video_url);
    try {
      await fs.access(videoPath);
    } catch (err) {
      return res.status(404).json({ error: '视频文件不存在', path: videoPath });
    }

    console.log('🎬 开始处理视频:', video.title);

    // 处理视频生成字幕
    const result = await subtitleService.processVideo(videoPath, video_id, {
      language,
      formats,
      createKnowledgeCards: create_cards,
      optimize: true
    });

    // 如果需要创建知识卡片，保存到数据库
    if (create_cards && result.knowledgeCards.length > 0) {
      const cards = await KnowledgeCard.bulkCreate(result.knowledgeCards);
      console.log(`✅ 已创建 ${cards.length} 张知识卡片`);
    }

    // 更新视频的字幕文件路径
    const subtitleRelativePath = result.files.srt.replace(path.join(process.cwd(), 'Backend'), '');
    await video.update({
      subtitle_url: subtitleRelativePath,
      has_subtitle: true
    });

    res.json({
      success: true,
      message: '字幕生成成功',
      data: {
        video_id,
        subtitle_count: result.subtitles.length,
        knowledge_card_count: result.knowledgeCards.length,
        files: {
          srt: subtitleRelativePath,
          vtt: result.files.vtt ? result.files.vtt.replace(path.join(process.cwd(), 'Backend'), '') : null
        }
      }
    });
  } catch (err) {
    console.error('❌ 字幕生成失败:', err);
    res.status(500).json({
      error: '字幕生成失败',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/**
 * GET /admin/subtitles/:video_id
 * 获取视频字幕内容
 */
router.get('/:video_id', async (req, res) => {
  try {
    const { video_id } = req.params;
    const { format = 'json' } = req.query;

    const video = await Video.findByPk(video_id);
    if (!video || !video.subtitle_url) {
      return res.status(404).json({ error: '字幕不存在' });
    }

    const subtitlePath = path.join(process.cwd(), 'Backend', video.subtitle_url);

    if (format === 'json') {
      // 返回 JSON 格式的字幕数据
      const subtitles = await subtitleService.parseSRT(subtitlePath);
      res.json({
        video_id,
        subtitle_count: subtitles.length,
        subtitles
      });
    } else {
      // 返回原始字幕文件
      const content = await fs.readFile(subtitlePath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    }
  } catch (err) {
    console.error('❌ 获取字幕失败:', err);
    res.status(500).json({ error: '获取字幕失败', message: err.message });
  }
});

/**
 * POST /admin/subtitles/:video_id/convert
 * 转换字幕格式
 */
router.post('/:video_id/convert', async (req, res) => {
  try {
    const { video_id } = req.params;
    const { format } = req.body; // 'vtt' or 'srt'

    if (!['vtt', 'srt'].includes(format)) {
      return res.status(400).json({ error: '不支持的格式' });
    }

    const video = await Video.findByPk(video_id);
    if (!video || !video.subtitle_url) {
      return res.status(404).json({ error: '字幕不存在' });
    }

    const srtPath = path.join(process.cwd(), 'Backend', video.subtitle_url);
    const vttPath = srtPath.replace('.srt', '.vtt');

    if (format === 'vtt') {
      await subtitleService.convertSRTtoVTT(srtPath, vttPath);
      res.json({
        success: true,
        message: '转换成功',
        file: vttPath.replace(path.join(process.cwd(), 'Backend'), '')
      });
    } else {
      res.json({ success: true, message: 'SRT 格式已存在' });
    }
  } catch (err) {
    console.error('❌ 格式转换失败:', err);
    res.status(500).json({ error: '格式转换失败', message: err.message });
  }
});

/**
 * POST /admin/subtitles/:video_id/cards
 * 从字幕生成知识卡片
 */
router.post('/:video_id/cards', async (req, res) => {
  try {
    const { video_id } = req.params;
    const { group_by_time = 30, min_text_length = 50 } = req.body;

    const video = await Video.findByPk(video_id);
    if (!video || !video.subtitle_url) {
      return res.status(404).json({ error: '字幕不存在' });
    }

    const subtitlePath = path.join(process.cwd(), 'Backend', video.subtitle_url);
    const subtitles = await subtitleService.parseSRT(subtitlePath);

    // 生成知识卡片
    const knowledgeCards = subtitleService.convertToKnowledgeCards(subtitles, video_id, {
      groupByTime: group_by_time,
      minTextLength: min_text_length,
      extractKeywords: true
    });

    // 保存到数据库
    const cards = await KnowledgeCard.bulkCreate(knowledgeCards);

    res.json({
      success: true,
      message: '知识卡片生成成功',
      count: cards.length,
      cards: cards.map(c => ({
        id: c.id,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime
      }))
    });
  } catch (err) {
    console.error('❌ 卡片生成失败:', err);
    res.status(500).json({ error: '卡片生成失败', message: err.message });
  }
});

/**
 * DELETE /admin/subtitles/:video_id
 * 删除视频字幕
 */
router.delete('/:video_id', async (req, res) => {
  try {
    const { video_id } = req.params;

    const video = await Video.findByPk(video_id);
    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    if (video.subtitle_url) {
      const subtitlePath = path.join(process.cwd(), 'Backend', video.subtitle_url);
      await fs.unlink(subtitlePath).catch(() => {});
      
      // 同时删除 VTT 文件
      const vttPath = subtitlePath.replace('.srt', '.vtt');
      await fs.unlink(vttPath).catch(() => {});
    }

    await video.update({
      subtitle_url: null,
      has_subtitle: false
    });

    res.json({
      success: true,
      message: '字幕已删除'
    });
  } catch (err) {
    console.error('❌ 删除字幕失败:', err);
    res.status(500).json({ error: '删除字幕失败', message: err.message });
  }
});

/**
 * GET /admin/subtitles/:video_id/search
 * 搜索字幕内容
 */
router.get('/:video_id/search', async (req, res) => {
  try {
    const { video_id } = req.params;
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: '缺少搜索关键词' });
    }

    const video = await Video.findByPk(video_id);
    if (!video || !video.subtitle_url) {
      return res.status(404).json({ error: '字幕不存在' });
    }

    const subtitlePath = path.join(process.cwd(), 'Backend', video.subtitle_url);
    const subtitles = await subtitleService.parseSRT(subtitlePath);

    // 搜索匹配的字幕
    const results = subtitles.filter(subtitle =>
      subtitle.text.toLowerCase().includes(keyword.toLowerCase())
    ).map(subtitle => ({
      startTime: subtitle.startTime,
      endTime: subtitle.endTime,
      text: subtitle.text,
      // 高亮关键词
      highlightedText: subtitle.text.replace(
        new RegExp(keyword, 'gi'),
        match => `<mark>${match}</mark>`
      )
    }));

    res.json({
      keyword,
      count: results.length,
      results
    });
  } catch (err) {
    console.error('❌ 搜索失败:', err);
    res.status(500).json({ error: '搜索失败', message: err.message });
  }
});

module.exports = router;
