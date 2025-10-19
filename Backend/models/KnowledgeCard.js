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
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    video_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    title: DataTypes.STRING,
    start_time: DataTypes.FLOAT,
    end_time: DataTypes.FLOAT,
    content_type: DataTypes.STRING
    // 根据你的数据库 schema 添加其他字段
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