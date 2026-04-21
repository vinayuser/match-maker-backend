const { DataTypes, Model } = require("sequelize");
const sequelize = require("./sequelize");

class AdminUserRole extends Model {}

AdminUserRole.init(
  {
    adminUserId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "admin_user_id",
      primaryKey: true
    },
    roleId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "role_id",
      primaryKey: true
    }
  },
  {
    sequelize,
    modelName: "AdminUserRole",
    tableName: "admin_user_roles"
  }
);

module.exports = AdminUserRole;
