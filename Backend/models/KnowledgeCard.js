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
    display_duration: { type: DataTypes.INTEGER, allowNull: true },

    title: { type: DataTypes.STRING(500), allowNull: false },
    content: { type: DataTypes.JSON, allowNull: false },
    content_type: { type: DataTypes.ENUM('text','formula','image','video','mixed'), allowNull: false, defaultValue: 'text' },

    display_style: { type: DataTypes.ENUM('popup','sidebar','drawer','floating'), allowNull: false, defaultValue: 'popup' },
    template_type: { type: DataTypes.ENUM('concept','person','formula','reading','example'), allowNull: false, defaultValue: 'concept' },

    auto_show: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    auto_hide: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    dismissible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

    is_ai_generated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ai_suggestion_score: { type: DataTypes.FLOAT, allowNull: true },
  }, {
    sequelize,
    modelName: 'KnowledgeCard',
    tableName: 'knowledge_cards',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return KnowledgeCard;
};