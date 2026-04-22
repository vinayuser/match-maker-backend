module.exports.up = async ({ sequelize }) => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      favorite_user_id BIGINT UNSIGNED NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_favorite_pair (user_id, favorite_user_id),
      KEY idx_favorites_user (user_id),
      KEY idx_favorites_target (favorite_user_id),
      CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_fav_target FOREIGN KEY (favorite_user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);
};
