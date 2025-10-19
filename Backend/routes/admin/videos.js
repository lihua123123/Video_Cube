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

/**
 * 删除视频
 * POST /admin/videos
 */
router.delete('/:id', async function (req, res){
    try{
        //获取视频id
        const { id} = req.params;
        const video = await Video.findByPk(id);

        if(video){
            await video.destroy();

            res.json({
                status: true,
                message:'删除视频成功'
            });
        }else{
            res.status(404).json({
                status: false,
                message:'视频不存在'
            });
        }
    }catch (error){
        res.status(500).json({
            status: false,
            message:'删除视频失败',
            error: error.message
        });
    }
})
/**
 * 更新视频
 * PUT /admin/videos/:id
 */
router.put('/:id', async function (req,res){
    try{
        const { id } = req.params;
        const video = await Video.findByPk(id);

        if(video){
            await video.update(req.body);

            res.json({
                status: true,
                message: '更新视频成功',
                data: video
            })
        }else{
            res.status(404).json({
                status: false,
                message: '视频不存在',
            });
        }
    }catch (error){
        res.status(500).json({
            status: false,
            message: '更新视频失败',
            error: error.message
        });
    }
})
module.exports = router;
