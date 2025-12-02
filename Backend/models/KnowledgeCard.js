'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class KnowledgeCard extends Model {
    static associate(models) {
      // 定义关联：一个知识卡片属于一个视频
      KnowledgeCard.belongsTo(models.Video, { foreignKey: 'video_id', as: 'video' });
    }
  }

  KnowledgeCard.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    video_id: { type: DataTypes.INTEGER, allowNull: false },

    start_time: { type: DataTypes.INTEGER, allowNull: false },
    end_time: { type: DataTypes.INTEGER, allowNull: true },

    title: { type: DataTypes.STRING(200), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    content_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'text' },

    display_style: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'popup' },

    is_ai_generated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    sequelize,
    modelName: 'KnowledgeCard',
    tableName: 'knowledge_cards',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return KnowledgeCard;
};