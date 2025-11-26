const express = require("express");
const router = express.Router();
const { Video } = require("../../models");
const { Op } = require("sequelize");
const uploadService = require("../../utils/upload-service");
const videoProcessor = require("../../utils/video-processor");
const uploadMiddleware = uploadService.createVideoUploadMiddleware();
/**
 * 公共方法：白名单过滤（仅允许写入以下字段）
 */
function filterBody(req) {
  const allowedKeys = [
    'title',
    'description',
    'video_url',
    'thumbnail_url',
    'duration',
    'status',
    'file_name',
    'thumbnail_name',
    'file_size',
    'resolution'
  ];
  const payload = {};
  for (const k of allowedKeys) {
    if (req.body[k] !== undefined) payload[k] = req.body[k];
  }
  return payload;
}

/**
 * 错误处理中间件
 */
function handleUploadError(err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      status: false,
      message: '文件大小超过限制（最大500MB）'
    });
  }
  
  return res.status(400).json({
    status: false,
    message: err.message || '文件上传失败'
  });
}

/**
 * 查询视频列表
 * GET /admin/videos
 */
router.get("/", async function (req, res) {
  try {
    // 查询视频列表
    const query = req.query || {};
    // 支持多种参数格式: limit/offset 或 currentPage/pageSize
    const limit = Math.max(1, Math.abs(Number(query.limit || query.pageSize)) || 10);
    const offset = query.offset !== undefined ? 
      Math.max(0, Math.abs(Number(query.offset))) : 
      ((Math.max(1, Math.abs(Number(query.currentPage)) || 1) - 1) * limit);
    
    const conditions = {
      order: [["id", "DESC"]],
      limit: limit,
      offset: offset
    };
    
    // 支持 keyword 和 title 两种搜索参数
    if (query.keyword || query.title) {
      conditions.where = {
        title: {
          [Op.like]: `%${query.keyword || query.title}%`,
        },
      };
    }

    // 使用 findAndCountAll 同时获取数据和总数
    const { count, rows } = await Video.findAndCountAll(conditions);
    
    // 返回视频列表
    res.json({
      status: true,
      message: "查询视频列表成功",
      data: {
        videos: rows,
        total: count
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "查询视频列表失败",
      error: error.message,
    });
  }
});

/**
 * 查询视频详情
 * GET /admin/videos/:id
 */
router.get("/:id", async function (req, res) {
  const { id } = req.params;
  // 查询视频详情
  const video = await Video.findByPk(id);
  if (!video) {
    return res.status(404).json({
      status: false,
      message: "视频不存在",
    });
  }
  // 返回视频详情
  res.json({
    status: true,
    message: "查询视频详情成功",
    data: {
      video,
    },
  });
});

/**
 * 上传视频文件
 * POST /admin/videos/upload
 */
router.post("/upload", uploadMiddleware, handleUploadError, async function (req, res) {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: '未找到上传的文件'
      });
    }
    
    // 处理上传的视频
    const processOptions = {
      generateThumbnail: true,
      transcode: req.body.transcode === 'true' // 是否需要转码
    };
    
    const processResult = await videoProcessor.processUploadedVideo(req.file, processOptions);
    
    // 构建视频数据（只包含数据库中存在的字段）
    const videoData = {
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      video_url: processResult.videoPath,
      thumbnail_url: processResult.thumbnailPath || null,
      duration: Math.round(processResult.videoInfo.duration) || 0,
      status: 'active'
      // 注意：已移除数据库中不存在的字段：file_name, thumbnail_name, file_size, resolution
    };
    
    // 创建视频记录
    const video = await Video.create(videoData);
    
    res.status(201).json({
      status: true,
      message: "视频上传和处理成功",
      data: {
        video,
        processInfo: processResult
      }
    });
  } catch (error) {
    console.error('视频上传处理失败:', error);
    res.status(500).json({
      status: false,
      message: "视频上传或处理失败",
      error: error.message
    });
  }
});

/**
 * 新建视频（仅创建记录，不包含文件上传）
 * POST /admin/videos
 */
router.post("/", async function (req, res) {
  try {
    const payload = filterBody(req);
    const video = await Video.create(payload);
    res.status(201).json({
      status: true,
      message: "新建视频成功",
      data: video,
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: "新建视频失败",
      error: error.message,
    });
  }
});

/**
 * 上传缩略图或为现有视频生成缩略图
 * POST /admin/videos/:id/thumbnail
 */
router.post("/:id/thumbnail", uploadService.createThumbnailUploadMiddleware(), async function (req, res) {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);
    
    if (!video) {
      return res.status(404).json({
        status: false,
        message: "视频不存在"
      });
    }
    
    // 如果有上传文件,使用上传的文件作为缩略图
    if (req.file) {
      console.log('📸 收到缩略图上传:', req.file);
      
      // 构建缩略图 URL (相对路径)
      const thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
      
      // 更新视频记录
      await video.update({
        thumbnail_url: thumbnailUrl
      });
      
      console.log('✅ 缩略图上传成功:', thumbnailUrl);
      
      return res.json({
        status: true,
        message: "缩略图上传成功",
        data: {
          video,
          thumbnail_url: thumbnailUrl
        }
      });
    }
    
    // 如果没有上传文件,且视频有关联文件,则自动生成缩略图
    if (video.file_name) {
      const thumbnailResult = await videoProcessor.generateThumbnailForExistingVideo(video.file_name);
      
      // 更新视频记录
      await video.update({
        thumbnail_url: thumbnailResult.thumbnailPath,
        thumbnail_name: thumbnailResult.thumbnailFileName
      });
      
      return res.json({
        status: true,
        message: "缩略图生成成功",
        data: {
          video,
          thumbnailInfo: thumbnailResult
        }
      });
    }
    
    // 既没有上传文件,也没有关联的视频文件
    return res.status(400).json({
      status: false,
      message: "请上传缩略图文件或确保视频有关联的文件"
    });
  } catch (error) {
    console.error('❌ 缩略图处理失败:', error);
    res.status(500).json({
      status: false,
      message: "缩略图处理失败",
      error: error.message
    });
  }
});

/**
 * 获取视频统计信息
 * GET /admin/videos/:id/stats
 */
router.get("/:id/stats", async function (req, res) {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);
    
    if (!video || !video.file_name) {
      return res.status(404).json({
        status: false,
        message: "视频不存在或没有关联的文件"
      });
    }
    
    const stats = await videoProcessor.getVideoStatistics(video.file_name);
    
    res.json({
      status: true,
      message: "获取视频统计信息成功",
      data: {
        video,
        statistics: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "获取视频统计信息失败",
      error: error.message
    });
  }
});

/**
 * 删除视频
 * DELETE /admin/videos/:id
 */
router.delete("/:id", async function (req, res) {
  try {
    //获取视频id
    const { id } = req.params;
    const video = await Video.findByPk(id);

    if (video) {
      await video.destroy();

      res.json({
        status: true,
        message: "删除视频成功",
      });
    } else {
      res.status(404).json({
        status: false,
        message: "视频不存在",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "删除视频失败",
      error: error.message,
    });
  }
});

/**
 * 更新视频
 * PUT /admin/videos/:id
 */
router.put("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);

    if (video) {
      const payload = filterBody(req);
      await video.update(payload);

      res.json({
        status: true,
        message: "更新视频成功",
        data: video,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "视频不存在",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "更新视频失败",
      error: error.message,
    });
  }
});

module.exports = router;
