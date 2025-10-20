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

/**
 * 新建知识卡片
 * POST /admin/knowledge_cards
 */
router.post('/', async function(req,res){
    try{
        const knowledgeCard = await KnowledgeCard.create(req.body);
        res.status(201).json({
            status: true,
            message: '新建知识卡片成功',
            data: knowledgeCard
        });
    }catch (error){
        res.status(400).json({
            status: false,
            message: '新建知识卡片失败',
            error: error.message
        });
    }
});
/**
 * 删除知识卡片
 * DELETE /admin/knowledge_cards/:id
 */
router.delete('/:id', async function (req, res){
    try{
        const { id } = req.params;
        const knowledge_cards = await KnowledgeCard.findByPk(id);
        if(knowledge_cards){
            await knowledge_cards.destroy();
            res.json({
                status: true,
                message: '删除知识卡片成功'
            });
        }else{
            res.status(404).json({
                status: false,
                message: '知识卡片不存在'
            })
        }
    }catch (error){
        res.status(500).json({
            status: false,
            message: '删除知识卡片失败',
            error: error.message
        })
    }
})

/**
 * 更新知识卡片
 * PUT /admin/knowledge_cards/:id
 */
router.put('/:id', async function(req, res){
    try{
        const { id } = req.params;
        const knowledge_cards = await KnowledgeCard.findByPk(id);
        if(knowledge_cards){
            await knowledge_cards.update(req.body);
            res.json({
                status: true,
                message: '更新知识卡片成功',
                data: knowledge_cards
            })
        }else{
            res.status(404).json({
                status: false,
                message: '知识卡片不存在'
            })
        }
    }catch (error){
        res.status(500).json({
            status: false,
            message: '更新知识卡片失败',
            error: error.message
        })
    }
})

module.exports = router;

