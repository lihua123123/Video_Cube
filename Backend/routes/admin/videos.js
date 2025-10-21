const express = require("express");
const router = express.Router();
const { Video } = require("../../models");
const { Op } = require("sequelize");
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
    'status'
  ];
  const payload = {};
  for (const k of allowedKeys) {
    if (req.body[k] !== undefined) payload[k] = req.body[k];
  }
  return payload;
}

/**
 * 查询视频列表
 * GET /admin/videos
 */
router.get("/", async function (req, res) {
  try {
    // 查询视频列表
    const query = req.query || {};
    // 当前是第几页，如果不传，那就是第一页
    const currentPage = Math.max(1, Math.abs(Number(query.currentPage)) || 1);
    // 每页显示多少条数据，如果不传，那就显示10条
    const pageSize = Math.max(1, Math.abs(Number(query.pageSize)) || 10);
    const offset = (currentPage - 1) * pageSize;
    const conditions = {
      order: [["id", "DESC"]],
      limit: pageSize,
      offset
    };
    if (query.title) {
      conditions.where = {
        title: {
          [Op.like]: `%${query.title}%`,
        },
      };
    }

    const videos = await Video.findAll(conditions);
    // 返回视频列表
    res.json({
      status: true,
      message: "查询视频列表成功",
      data: {
        videos,
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
 * 新建视频
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
 * 删除视频
 * POST /admin/videos
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
