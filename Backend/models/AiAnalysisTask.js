'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AiAnalysisTask extends Model {
    static associate(models) {
      // 定义关联：一个AI任务属于一个视频
      AiAnalysisTask.belongsTo(models.Video, { foreignKey: 'video_id', as: 'video' });
    }
  }
  AiAnalysisTask.init({
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    video_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    task_type: DataTypes.STRING,
    status: DataTypes.STRING,
    progress: DataTypes.FLOAT
    // 根据你的数据库 schema 添加其他字段
  }, {
    sequelize,
    modelName: 'AiAnalysisTask',
    tableName: 'ai_analysis_tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return AiAnalysisTask;
};