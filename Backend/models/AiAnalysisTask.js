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

    task_type: { type: DataTypes.STRING(20), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
    progress: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    result_data: { type: DataTypes.TEXT, allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },

    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
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