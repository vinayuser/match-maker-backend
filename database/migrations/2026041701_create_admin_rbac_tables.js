module.exports.up = async ({ sequelize }) => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS admin_permissions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`key\` VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      module VARCHAR(64) NOT NULL,
      description VARCHAR(255) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_permissions_key (\`key\`),
      KEY idx_admin_permissions_module_active (module, is_active)
    ) ENGINE=InnoDB;
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS admin_roles (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      slug VARCHAR(80) NOT NULL,
      description VARCHAR(255) DEFAULT NULL,
      is_system TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_by BIGINT UNSIGNED DEFAULT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_roles_slug (slug),
      KEY idx_admin_roles_active (is_active),
      CONSTRAINT fk_admin_roles_creator FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS admin_role_permissions (
      role_id BIGINT UNSIGNED NOT NULL,
      permission_id BIGINT UNSIGNED NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (role_id, permission_id),
      CONSTRAINT fk_admin_role_permissions_role FOREIGN KEY (role_id) REFERENCES admin_roles (id) ON DELETE CASCADE,
      CONSTRAINT fk_admin_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES admin_permissions (id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS admin_user_roles (
      admin_user_id BIGINT UNSIGNED NOT NULL,
      role_id BIGINT UNSIGNED NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (admin_user_id, role_id),
      CONSTRAINT fk_admin_user_roles_admin FOREIGN KEY (admin_user_id) REFERENCES admin_users (id) ON DELETE CASCADE,
      CONSTRAINT fk_admin_user_roles_role FOREIGN KEY (role_id) REFERENCES admin_roles (id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);
};
