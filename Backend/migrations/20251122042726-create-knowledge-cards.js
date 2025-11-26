'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('knowledge_cards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      video_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'videos',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      start_time: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      end_time: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      content_type: {
        type: Sequelize.STRING,
        defaultValue: 'text'
      },
      display_style: {
        type: Sequelize.STRING,
        defaultValue: 'default'
      },
      is_ai_generated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('knowledge_cards');
  }
};
