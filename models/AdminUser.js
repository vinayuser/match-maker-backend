const { DataTypes, Model } = require("sequelize");
const sequelize = require("./sequelize");

class AdminUser extends Model {}

AdminUser.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    avatarUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      field: "avatar_url"
    },
    role: {
      type: DataTypes.ENUM("super_admin", "matchmaker_admin"),
      allowNull: false,
      defaultValue: "matchmaker_admin"
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash"
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active"
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "created_by"
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login_at"
    }
  },
  {
    sequelize,
    modelName: "AdminUser",
    tableName: "admin_users"
  }
);

module.exports = AdminUser;
