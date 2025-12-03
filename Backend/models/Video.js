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
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'processing'
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    thumbnail_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '文件大小（字节）'
    },
    resolution: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '视频分辨率，如 1920x1080'
    }
  }, {
    sequelize,
    modelName: 'Video',
    tableName: 'videos',
    timestamps: true,
    underscored: true,      // ✅ 修复：使用下划线命名
    createdAt: 'created_at',  // ✅ 映射到数据库的 created_at 字段
    updatedAt: 'updated_at'   // ✅ 映射到数据库的 updated_at 字段
  });
  return Video;
};
