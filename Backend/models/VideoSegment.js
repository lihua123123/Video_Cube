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
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    video_id: { type: DataTypes.INTEGER, allowNull: false },

    segment_index: { type: DataTypes.INTEGER, allowNull: false },
    start_time: { type: DataTypes.INTEGER, allowNull: false },
    end_time: { type: DataTypes.INTEGER, allowNull: false },

    title: { type: DataTypes.STRING(200), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'VideoSegment',
    tableName: 'video_segments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return VideoSegment;
};