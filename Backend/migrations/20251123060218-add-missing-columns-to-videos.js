'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 获取当前表结构
    const tableDescription = await queryInterface.describeTable('videos');
    
    // 安全添加列 - 检查是否存在后再添加
    if (!tableDescription.file_name) {
      await queryInterface.addColumn('videos', 'file_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'status'
      });
    }
    
    if (!tableDescription.thumbnail_name) {
      await queryInterface.addColumn('videos', 'thumbnail_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'file_name'
      });
    }
    
    if (!tableDescription.file_size) {
      await queryInterface.addColumn('videos', 'file_size', {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '文件大小(字节)',
        after: 'thumbnail_name'
      });
    }
    
    if (!tableDescription.resolution) {
      await queryInterface.addColumn('videos', 'resolution', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '视频分辨率,如 1920x1080',
        after: 'file_size'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // 获取当前表结构
    const tableDescription = await queryInterface.describeTable('videos');
    
    // 安全移除列 - 检查是否存在后再移除
    if (tableDescription.file_name) {
      await queryInterface.removeColumn('videos', 'file_name');
    }
    
    if (tableDescription.thumbnail_name) {
      await queryInterface.removeColumn('videos', 'thumbnail_name');
    }
    
    if (tableDescription.file_size) {
      await queryInterface.removeColumn('videos', 'file_size');
    }
    
    if (tableDescription.resolution) {
      await queryInterface.removeColumn('videos', 'resolution');
    }
  }
};