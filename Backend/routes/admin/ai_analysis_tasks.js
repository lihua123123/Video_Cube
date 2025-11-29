const express = require("express");
const router = express.Router();
const { AiAnalysisTask } = require("../../models");
const { Op } = require("sequelize");

/**
 * 公共方法：白名单过滤（仅允许写入以下字段）
 */
function filterBody(req) {
  const allowedKeys = [
    'video_id',
    'task_type',
    'status',
    'progress',
    'result_data',
    'error_message',
    'completed_at'
  ];
  const payload = {};
  for (const k of allowedKeys) {
    if (req.body[k] !== undefined) payload[k] = req.body[k];
  }
  return payload;
}

/**
 * 查询AI分析任务列表
 * GET /admin/ai_analysis_tasks
 */
router.get("/", async function (req, res) {
  try {
    const query = req.query || {};
    const currentPage = Math.max(1, Math.abs(Number(query.currentPage)) || 1);
    const pageSize = Math.max(1, Math.abs(Number(query.pageSize)) || 10);
    const offset = (currentPage - 1) * pageSize;

    const where = {};
    if (query.status) where.status = query.status;
    if (query.task_type) where.task_type = query.task_type;

    const conditions = {
      order: [["id", "DESC"]],
      limit: pageSize,
      offset,
      where: Object.keys(where).length ? where : undefined
    };

    const tasks = await AiAnalysisTask.findAll(conditions);
    res.json({
      status: true,
      message: "查询AI分析任务列表成功",
      data: { tasks },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "查询AI分析任务列表失败",
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
  // 查询AI分析任务详情
  const task = await AiAnalysisTask.findByPk(id);
  if (!task) {
    return res.status(404).json({
      status: false,
      message: "AI分析任务不存在",
    });
  }
  // 返回AI分析任务详情
  res.json({
    status: true,
    message: "查询AI分析任务详情成功",
    data: {
      task,
    },
  });
});

/**
 * 新建AI分析任务
 * POST /admin/ai_analysis_tasks
 */
router.post("/", async function (req, res) {
  try {
    const payload = filterBody(req);
    const task = await AiAnalysisTask.create(payload);
    res.status(201).json({
      status: true,
      message: "新建AI分析任务成功",
      data: task,
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: "新建AI分析任务失败",
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
    //获取AI分析任务id
    const { id } = req.params;
    const task = await AiAnalysisTask.findByPk(id);

    if (task) {
      await task.destroy();

      res.json({
        status: true,
        message: "删除AI分析任务成功",
      });
    } else {
      res.status(404).json({
        status: false,
        message: "AI分析任务不存在",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "删除AI分析任务失败",
      error: error.message,
    });
  }
});

/**
 * 更新AI分析任务
 * PUT /admin/ai_analysis_tasks/:id
 */
router.put("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const task = await AiAnalysisTask.findByPk(id);

    if (task) {
      const payload = filterBody(req);
      await task.update(payload);

      res.json({
        status: true,
        message: "更新AI分析任务成功",
        data: task,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "AI分析任务不存在",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "更新AI分析任务失败",
      error: error.message,
    });
  }
});
module.exports = router;
