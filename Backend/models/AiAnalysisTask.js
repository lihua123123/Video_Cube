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
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    video_id: { type: DataTypes.INTEGER, allowNull: false },

    task_type: { type: DataTypes.ENUM('summary','segmentation','card_generation','full_analysis'), allowNull: false },
    input_data: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },

    status: { type: DataTypes.ENUM('pending','processing','completed','failed','cancelled'), allowNull: false, defaultValue: 'pending' },
    progress: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    result_data: { type: DataTypes.JSON, allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },

    processing_time: { type: DataTypes.INTEGER, allowNull: true },
    model_used: { type: DataTypes.STRING(100), allowNull: true },

    started_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'AiAnalysisTask',
    tableName: 'ai_analysis_tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return AiAnalysisTask;
};