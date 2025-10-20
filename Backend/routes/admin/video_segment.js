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

module.exports = router;    