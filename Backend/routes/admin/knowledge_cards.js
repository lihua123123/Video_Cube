const express = require("express");
const router = express.Router();
const { KnowledgeCard } = require("../../models");
const { Op } = require("sequelize");

/**
 * 公共方法：白名单过滤（仅允许写入以下字段）
 */
function filterBody(req) {
  const allowedKeys = [
    "video_id",
    "start_time",
    "end_time",
    "title",
    "content",
    "content_type",
    "display_style",
    "is_ai_generated",
  ];
  const payload = {};
  for (const k of allowedKeys) {
    if (req.body[k] !== undefined) payload[k] = req.body[k];
  }
  return payload;
}

/**
 * 查询知识卡片列表
 * GET /admin/knowledge_cards
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
      where: {},
    };
    
    // 支持按video_id过滤
    if (query.video_id) {
      conditions.where.video_id = query.video_id;
    }
    
    // 支持按title模糊搜索
    if (query.title) {
      conditions.where.title = {
        [Op.like]: `%${query.title}%`,
      };
    }
    
    // 如果没有任何过滤条件,删除空的where对象
    if (Object.keys(conditions.where).length === 0) {
      delete conditions.where;
    }
    const result = await KnowledgeCard.findAndCountAll(conditions);
    
    // 返回知识卡片列表
    res.json({
      status: true,
      message: "查询知识卡片列表成功",
      data: {
        knowledgeCards: result.rows,
        total: result.count,
        currentPage,
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "查询知识卡片列表失败",
      error: error.message,
    });
  }
});

/**
 * 查询知识卡片详情
 * GET /admin/knowledge_cards/:id
 */
router.get("/:id", async function (req, res) {
  const { id } = req.params;
  const knowledgeCard = await KnowledgeCard.findByPk(id);
  if (!knowledgeCard) {
    return res.status(404).json({
      status: false,
      message: "知识卡片不存在",
    });
  }
  res.json({
    status: true,
    message: "查询知识卡片详情成功",
    data: {
      knowledgeCard,
    },
  });
});

/**
 * 新建知识卡片
 * POST /admin/knowledge_cards
 */
router.post("/", async function (req, res) {
  try {
    const payload = filterBody(req);
    const knowledgeCard = await KnowledgeCard.create(payload);
    res.status(201).json({
      status: true,
      message: "新建知识卡片成功",
      data: knowledgeCard,
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: "新建知识卡片失败",
      error: error.message,
    });
  }
});
/**
 * 删除知识卡片
 * DELETE /admin/knowledge_cards/:id
 */
router.delete("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const knowledge_cards = await KnowledgeCard.findByPk(id);
    if (knowledge_cards) {
      await knowledge_cards.destroy();
      res.json({
        status: true,
        message: "删除知识卡片成功",
      });
    } else {
      res.status(404).json({
        status: false,
        message: "知识卡片不存在",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "删除知识卡片失败",
      error: error.message,
    });
  }
});

/**
 * 更新知识卡片
 * PUT /admin/knowledge_cards/:id
 */
router.put("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const knowledge_cards = await KnowledgeCard.findByPk(id);
    if (knowledge_cards) {
      const payload = filterBody(req);
      await knowledge_cards.update(payload);
      res.json({
        status: true,
        message: "更新知识卡片成功",
        data: knowledge_cards,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "知识卡片不存在",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "更新知识卡片失败",
      error: error.message,
    });
  }
});

module.exports = router;
