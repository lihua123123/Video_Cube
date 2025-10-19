const express = require("express");
const router = express.Router();
const { KnowledgeCard } = require("../../models");

/**
 * 查询知识卡片列表
 * GET /admin/knowledge_cards
 */
router.get('/', async function(req, res){
    // 查询知识卡片列表
    const knowledgeCards = await KnowledgeCard.findAll();
    // 返回知识卡片列表
    res.json({
        status: true,
        message: '查询知识卡片列表成功',
        data: {
            knowledgeCards
        },
    });
});

/**
 * 查询知识卡片详情
 * GET /admin/knowledge_cards/:id
 */
router.get('/:id', async function(req, res){
    const { id } = req.params;
    const knowledgeCard = await KnowledgeCard.findByPk(id);
    if(!knowledgeCard){
        return res.status(404).json({
            status: false,
            message: '知识卡片不存在',
        });
    }
    res.json({
        status: true,
        message: '查询知识卡片详情成功',
        data: {
            knowledgeCard
        },
    });
});
module.exports = router;

