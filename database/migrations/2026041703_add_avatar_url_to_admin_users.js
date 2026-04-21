module.exports.up = async ({ sequelize }) => {
  const [rows] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'admin_users'
      AND COLUMN_NAME = 'avatar_url'
  `);

  if (Number(rows?.[0]?.count || 0) === 0) {
    await sequelize.query(`
      ALTER TABLE admin_users
      ADD COLUMN avatar_url VARCHAR(1024) DEFAULT NULL AFTER name
    `);
  }
};
