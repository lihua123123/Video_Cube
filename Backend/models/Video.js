'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Video extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Video.hasMany(models.KnowledgeCard, { foreignKey: 'video_id', as: 'knowledgeCards' });
      Video.hasMany(models.AiAnalysisTask, { foreignKey: 'video_id', as: 'aiAnalysisTasks' });
      Video.hasMany(models.VideoSegment, { foreignKey: 'video_id', as: 'videoSegments' });
    }
  }
  Video.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: DataTypes.TEXT,
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    thumbnail_url: DataTypes.STRING(500),
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('uploading', 'processing', 'ready', 'published', 'private'),
      allowNull: false,
      defaultValue: 'uploading'
    },
    ai_analysis_status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    edit_token: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    view_token: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Video',
    tableName: 'videos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Video;
};
