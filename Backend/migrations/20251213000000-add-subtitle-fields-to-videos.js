'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 添加字幕相关字段到 videos 表
    await queryInterface.addColumn('videos', 'subtitle_url', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '字幕文件URL'
    });

    await queryInterface.addColumn('videos', 'has_subtitle', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: '是否有字幕'
    });

    await queryInterface.addColumn('videos', 'subtitle_language', {
      type: Sequelize.STRING(10),
      allowNull: true,
      comment: '字幕语言代码'
    });

    // 添加字幕元数据字段
    await queryInterface.addColumn('videos', 'subtitle_generated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '字幕生成时间'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('videos', 'subtitle_url');
    await queryInterface.removeColumn('videos', 'has_subtitle');
    await queryInterface.removeColumn('videos', 'subtitle_language');
    await queryInterface.removeColumn('videos', 'subtitle_generated_at');
  }
};
