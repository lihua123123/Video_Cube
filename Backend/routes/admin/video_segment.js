const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { VideoSegment } = require("../../models");
/**
 * 查询视频分段列表
 * GET /admin/video_segments
 */

router.get("/", async function (req, res) {
  try {
    // 查询视频分段列表
    // 当前是第几页，如果不传，那就是第一页
    const currentPage = Math.abs(Number(query.currentPage)) || 1;

    // 每页显示多少条数据，如果不传，那就显示10条
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;
    const query = req.query;
    const conditions = {
      order: [["id", "DESC"]],
      limit: pageSize,
      offset: offset,
    };
    if (query.title) {
      conditions.where = {
        title: {
          [Op.like]: `%${query.title}%`,
        },
      };
    }

    if (query.keywords) {
      conditions.where = {
        keywords: {
          [Op.like]: `%${query.keywords}%`,
        },
      };
    }

    const videoSegments = await VideoSegment.findAll(conditions);
    // 返回视频分段列表
    res.json({
      status: true,
      message: "查询视频分段列表成功",
      data: {
        videoSegments,
      },
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
    const videoSegment = await VideoSegment.create(req.body);
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
      await videoSegment.update(req.body);

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
