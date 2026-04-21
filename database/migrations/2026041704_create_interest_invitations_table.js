module.exports.up = async ({ sequelize }) => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS interest_invitations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      from_user_id BIGINT UNSIGNED NOT NULL,
      to_user_id BIGINT UNSIGNED NOT NULL,
      status ENUM('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_invite_pair (from_user_id, to_user_id),
      KEY idx_invite_to (to_user_id, status),
      KEY idx_invite_from (from_user_id, status),
      CONSTRAINT fk_inv_from FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_inv_to FOREIGN KEY (to_user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);
};
