const express = require("express");
const router = express.Router();
const { Video } = require("../../models");
/**
 * 查询视频列表
 * GET /admin/videos
 */
router.get("/", async function (req, res) {
  // 查询视频列表
  const videos = await Video.findAll();
  // 返回视频列表
  res.json({
    status: true,
    message: "查询视频列表成功",
    data: {
      videos,
    },
  });
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
router.post('/', async function (req, res){
    try{
        const video = await Video.create(req.body);
        res.status(201).json({
            status: true,
            message: '新建视频成功',
            data:  video 
        });
    }catch (error){
        res.status(400).json({
            status: false,
            message: '新建视频失败',
            error: error.message
        })
    }
});
module.exports = router;
