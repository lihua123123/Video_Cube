const express = require('express');
const router = express.Router();
const { Video } = require('../../models');
/**
 * 查询视频列表
 * GET /admin/videos
 */
router.get('/', async function (req, res) {
    // 查询视频列表
    const videos = await Video.findAll();
    // 返回视频列表
    res.json({
        status: true,
        message: '查询视频列表成功',
        data:{
            videos
        }
    });
});
module.exports = router;
