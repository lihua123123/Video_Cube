'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VideoSegment extends Model {
    static associate(models) {
      // 定义关联：一个视频分段属于一个视频
      VideoSegment.belongsTo(models.Video, { foreignKey: 'video_id', as: 'video' });
    }
  }
  VideoSegment.init({
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    video_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    segment_index: DataTypes.INTEGER,
    title: DataTypes.STRING,
    start_time: DataTypes.FLOAT,
    end_time: DataTypes.FLOAT
    // 根据你的数据库 schema 添加其他字段
  }, {
    sequelize,
    modelName: 'VideoSegment',
    tableName: 'video_segments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return VideoSegment;
};