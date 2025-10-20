const express = require("express");
const router = express.Router();
const { VideoSegment } = require("../../models");
/**
 * 查询视频分段列表
 * GET /admin/video_segments
 */

router.get("/", async function (req, res) {
  // 查询视频分段列表
  const videoSegments = await VideoSegment.findAll();
  // 返回视频分段列表
  res.json({
    status: true,
    message: "查询视频分段列表成功",
    data: {
      videoSegments,
    },
  });
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

module.exports = router;    