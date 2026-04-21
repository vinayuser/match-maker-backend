module.exports.up = async ({ sequelize }) => {
  const [tableRows] = await sequelize.query(`
    SELECT TABLE_NAME AS tableName
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
  `);

  for (const row of tableRows) {
    const tableName = row.tableName;

    const [columnRows] = await sequelize.query(
      `
      SELECT COLUMN_NAME AS columnName
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      `,
      { replacements: [tableName] }
    );
    const columns = new Set(columnRows.map((item) => item.columnName));

    if (!columns.has("created_at")) {
      if (columns.has("createdAt")) {
        await sequelize.query(`
          ALTER TABLE \`${tableName}\`
          ADD COLUMN created_at DATETIME(3) NULL
        `);
        await sequelize.query(`
          UPDATE \`${tableName}\`
          SET created_at = \`createdAt\`
          WHERE created_at IS NULL
        `);
        await sequelize.query(`
          ALTER TABLE \`${tableName}\`
          MODIFY COLUMN created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        `);
      } else {
        await sequelize.query(`
          ALTER TABLE \`${tableName}\`
          ADD COLUMN created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        `);
      }
    }

    if (!columns.has("updated_at")) {
      if (columns.has("updatedAt")) {
        await sequelize.query(`
          ALTER TABLE \`${tableName}\`
          ADD COLUMN updated_at DATETIME(3) NULL
        `);
        await sequelize.query(`
          UPDATE \`${tableName}\`
          SET updated_at = \`updatedAt\`
          WHERE updated_at IS NULL
        `);
        await sequelize.query(`
          ALTER TABLE \`${tableName}\`
          MODIFY COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        `);
      } else {
        await sequelize.query(`
          ALTER TABLE \`${tableName}\`
          ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        `);
      }
    }
  }
};
