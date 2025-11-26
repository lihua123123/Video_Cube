'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 添加缺失的列到 videos 表
    await queryInterface.addColumn('videos', 'file_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'status'
    });
    
    await queryInterface.addColumn('videos', 'thumbnail_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'file_name'
    });
    
    await queryInterface.addColumn('videos', 'file_size', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: '文件大小(字节)',
      after: 'thumbnail_name'
    });
    
    await queryInterface.addColumn('videos', 'resolution', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: '视频分辨率,如 1920x1080',
      after: 'file_size'
    });
  },

  async down (queryInterface, Sequelize) {
    // 移除添加的列
    await queryInterface.removeColumn('videos', 'file_name');
    await queryInterface.removeColumn('videos', 'thumbnail_name');
    await queryInterface.removeColumn('videos', 'file_size');
    await queryInterface.removeColumn('videos', 'resolution');
  }
};
