-- Kesher — MySQL 8+ / InnoDB / utf8mb4
-- Run once: mysql -u user -p kesher < database/schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS kesher
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kesher;

-- ---------------------------------------------------------------------------
-- Users (auth only — narrow row, high write volume on login)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Admin users (super admin + matchmaker admins with scoped permissions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  role ENUM('super_admin','matchmaker_admin') NOT NULL DEFAULT 'matchmaker_admin',
  password_hash VARCHAR(255) NOT NULL,
  permissions JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED DEFAULT NULL,
  last_login_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email),
  KEY idx_admin_users_role_active (role, is_active),
  CONSTRAINT fk_admin_users_creator FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Admin permissions and roles (RBAC for matchmaker admins)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  module VARCHAR(64) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_permissions_key (`key`),
  KEY idx_admin_permissions_module_active (module, is_active)
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_admin_role_permissions_role FOREIGN KEY (role_id) REFERENCES admin_roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_admin_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES admin_permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_user_roles (
  admin_user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (admin_user_id, role_id),
  CONSTRAINT fk_admin_user_roles_admin FOREIGN KEY (admin_user_id) REFERENCES admin_users (id) ON DELETE CASCADE,
  CONSTRAINT fk_admin_user_roles_role FOREIGN KEY (role_id) REFERENCES admin_roles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Profile (one row per user — avoids hot rows on users table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  -- Basic
  first_name VARCHAR(120) DEFAULT NULL,
  last_name VARCHAR(120) DEFAULT NULL,
  gender ENUM('male','female','other') DEFAULT NULL,
  date_of_birth DATE DEFAULT NULL,
  phone VARCHAR(64) DEFAULT NULL,
  email_visible TINYINT(1) NOT NULL DEFAULT 0,
  phone_visible TINYINT(1) NOT NULL DEFAULT 0,
  city VARCHAR(120) DEFAULT NULL,
  country VARCHAR(120) DEFAULT NULL,
  current_location VARCHAR(255) DEFAULT NULL,
  native_language VARCHAR(64) DEFAULT NULL,
  additional_languages JSON DEFAULT NULL,
  education_level VARCHAR(120) DEFAULT NULL,
  field_of_study VARCHAR(255) DEFAULT NULL,
  occupation VARCHAR(255) DEFAULT NULL,
  work_details TEXT,
  -- Religious / lifestyle
  religious_level VARCHAR(64) DEFAULT NULL,
  shabbat_observance VARCHAR(64) DEFAULT NULL,
  kashrut_level VARCHAR(64) DEFAULT NULL,
  prayer_synagogue VARCHAR(255) DEFAULT NULL,
  dress_style VARCHAR(255) DEFAULT NULL,
  lifestyle_description TEXT,
  -- Personal narrative
  about_me TEXT,
  personality_traits JSON DEFAULT NULL,
  hobbies JSON DEFAULT NULL,
  life_goals TEXT,
  important_values TEXT,
  looking_for_relationship TEXT,
  -- Family
  family_description TEXT,
  parents_background TEXT,
  siblings_count INT UNSIGNED DEFAULT NULL,
  birth_order VARCHAR(64) DEFAULT NULL,
  family_religious_style VARCHAR(128) DEFAULT NULL,
  family_style VARCHAR(128) DEFAULT NULL,
  mother_heritage VARCHAR(255) DEFAULT NULL,
  father_heritage VARCHAR(255) DEFAULT NULL,
  family_narrative TEXT,
  sibling_notes TEXT,
  -- Appearance & lifestyle
  height_cm SMALLINT UNSIGNED DEFAULT NULL,
  smoking ENUM('no','sometimes','yes') DEFAULT NULL,
  alcohol ENUM('no','sometimes','yes') DEFAULT NULL,
  driving_license ENUM('yes','no','unknown') DEFAULT NULL,
  willing_relocate ENUM('yes','no','maybe') DEFAULT NULL,
  -- Marital & children
  marital_status ENUM('single','divorced','widowed') DEFAULT NULL,
  has_children TINYINT(1) DEFAULT NULL,
  children_count SMALLINT UNSIGNED DEFAULT NULL,
  children_live_with ENUM('yes','no','partially') DEFAULT NULL,
  want_more_children ENUM('yes','no','not_sure') DEFAULT NULL,
  -- Male / halachic
  is_cohen TINYINT(1) DEFAULT NULL,
  lineage_notes VARCHAR(255) DEFAULT NULL,
  -- Match preferences
  looking_for_gender ENUM('male','female') DEFAULT NULL,
  preferred_age_min SMALLINT UNSIGNED DEFAULT NULL,
  preferred_age_max SMALLINT UNSIGNED DEFAULT NULL,
  preferred_location TEXT,
  preferred_religious_level VARCHAR(128) DEFAULT NULL,
  preferred_lifestyle VARCHAR(255) DEFAULT NULL,
  preferred_background TEXT,
  important_values_match TEXT,
  deal_breakers TEXT,
  preferred_personality_traits TEXT,
  relationship_goal VARCHAR(128) DEFAULT NULL,
  marriage_timeline VARCHAR(255) DEFAULT NULL,
  open_to_matchmaker TINYINT(1) DEFAULT NULL,
  match_religious_preference VARCHAR(128) DEFAULT NULL,
  deal_breaker_smoker TINYINT(1) DEFAULT NULL,
  deal_breaker_different_religious_level TINYINT(1) DEFAULT NULL,
  deal_breaker_has_children TINYINT(1) DEFAULT NULL,
  agreement_accepted TINYINT(1) DEFAULT NULL,
  -- System
  profile_status ENUM('draft','pending_review','active','paused','in_match','closed') NOT NULL DEFAULT 'draft',
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  verification_status ENUM('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified',
  assigned_matchmaker_id BIGINT UNSIGNED DEFAULT NULL,
  internal_notes TEXT,
  last_onboarding_step VARCHAR(64) DEFAULT NULL,
  onboarding_completed_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  KEY idx_profile_status_gender (profile_status, gender),
  KEY idx_profile_marital (marital_status),
  KEY idx_profile_cohen (gender, is_cohen),
  KEY idx_profile_locked (is_locked),
  KEY idx_profile_pending (profile_status, onboarding_completed_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Photos (separate table — large VARCHAR URLs, optional CDN keys later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_photos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(1024) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  moderation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_photos_user (user_id),
  CONSTRAINT fk_photos_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Interest invitations (no direct chat — mutual accept → match)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Matches (both users locked while active)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_a_id BIGINT UNSIGNED NOT NULL,
  user_b_id BIGINT UNSIGNED NOT NULL,
  matchmaker_id BIGINT UNSIGNED DEFAULT NULL,
  status ENUM('active','closed') NOT NULL DEFAULT 'active',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_match_pair (user_a_id, user_b_id),
  KEY idx_match_user_a (user_a_id, status),
  KEY idx_match_user_b (user_b_id, status),
  CONSTRAINT fk_ma FOREIGN KEY (user_a_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_mb FOREIGN KEY (user_b_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Backfill missing audit columns on existing tables.
SET @stmt = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_photos'
      AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE user_photos ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)',
  'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'matches'
      AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE matches ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)',
  'SELECT 1'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;
