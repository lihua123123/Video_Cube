const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { VideoSegment } = require("../../models");

/**
 * 公共方法：白名单过滤（仅允许写入以下字段）
 */
function filterBody(req) {
  const allowedKeys = [
    'video_id',
    'segment_index',
    'start_time',
    'end_time',
    'title',
    'summary'
  ];
  const payload = {};
  for (const k of allowedKeys) {
    if (req.body[k] !== undefined) payload[k] = req.body[k];
  }
  return payload;
}

/**
 * 查询视频分段列表
 * GET /admin/video_segments
 */
router.get("/", async function (req, res) {
  try {
    const query = req.query || {};
    const currentPage = Math.max(1, Math.abs(Number(query.currentPage)) || 1);
    const pageSize = Math.max(1, Math.abs(Number(query.pageSize)) || 10);
    const offset = (currentPage - 1) * pageSize;
    const conditions = {
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
    };
    if (query.title) {
      conditions.where = {
        title: { [Op.like]: `%${query.title}%` },
      };
    }

    const videoSegments = await VideoSegment.findAll(conditions);
    res.json({
      status: true,
      message: "查询视频分段列表成功",
      data: { videoSegments },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "查询视频分段列表失败",
      error: error.message,
    });
  }
});

/**
 * 查询视频分段详情
 * GET /admin/video_segments/:id
 */
router.get("/:id", async function (req, res) {
  const { id } = req.params;
  // 查询视频分段详情
  const videoSegment = await VideoSegment.findByPk(id);
  if (!videoSegment) {
    return res.status(404).json({
      status: false,
      message: "视频分段不存在",
    });
  }
  // 返回视频分段详情
  res.json({
    status: true,
    message: "查询视频分段详情成功",
    data: {
      videoSegment,
    },
  });
});
/**
 * 新建视频分段
 * POST /admin/video_segments
 */
router.post("/", async function (req, res) {
  try {
    const payload = filterBody(req);
    if (payload.segment_index === undefined) {
      return res.status(400).json({ status: false, message: 'segment_index 为必填' });
    }
    const videoSegment = await VideoSegment.create(payload);
    res.status(201).json({
      status: true,
      message: "新建视频分段成功",
      data: videoSegment,
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: "新建视频分段失败",
      error: error.message,
    });
  }
});

/**
 * 删除视频分段
 * DELETE /admin/video_segments/:id
 */
router.delete("/:id", async function (req, res) {
  try {
    //获取视频分段id
    const { id } = req.params;
    const videoSegment = await VideoSegment.findByPk(id);

    if (videoSegment) {
      await videoSegment.destroy();

      res.json({
        status: true,
        message: "删除视频分段成功",
      });
    } else {
      res.status(404).json({
        status: false,
        message: "视频分段不存在",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "删除视频分段失败",
      error: error.message,
    });
  }
});

/**
 * 更新视频分段
 * PUT /admin/video_segments/:id
 */
router.put("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const videoSegment = await VideoSegment.findByPk(id);

    if (videoSegment) {
      const payload = filterBody(req);
      await videoSegment.update(payload);

      res.json({
        status: true,
        message: "更新视频分段成功",
        data: videoSegment,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "视频分段不存在",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "更新视频分段失败",
      error: error.message,
    });
  }
});

module.exports = router;
