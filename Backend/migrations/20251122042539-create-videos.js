'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('videos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      video_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      thumbnail_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      duration: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'active'
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      thumbnail_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      resolution: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('videos');
  }
};
