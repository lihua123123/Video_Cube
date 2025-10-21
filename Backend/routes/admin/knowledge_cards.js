const express = require("express");
const router = express.Router();
const { KnowledgeCard } = require("../../models");
const { Op } = require("sequelize");
/**
 * 查询知识卡片列表
 * GET /admin/knowledge_cards
 */
router.get("/", async function (req, res) {
  try {
    // 当前是第几页，如果不传，那就是第一页
    const currentPage = Math.abs(Number(query.currentPage)) || 1;

    // 每页显示多少条数据，如果不传，那就显示10条
    const pageSize = Math.abs(Number(query.pageSize)) || 10;
    const offset = (currentPage - 1) * pageSize;
    // 查询知识卡片列表

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
    const knowledgeCards = await KnowledgeCard.findAll(conditions);
    // 返回知识卡片列表
    res.json({
      status: true,
      message: "查询知识卡片列表成功",
      data: {
        knowledgeCards,
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
    const knowledgeCard = await KnowledgeCard.create(req.body);
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
      await knowledge_cards.update(req.body);
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
