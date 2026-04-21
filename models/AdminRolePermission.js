const { DataTypes, Model } = require("sequelize");
const sequelize = require("./sequelize");

class AdminRolePermission extends Model {}

AdminRolePermission.init(
  {
    roleId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "role_id",
      primaryKey: true
    },
    permissionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "permission_id",
      primaryKey: true
    }
  },
  {
    sequelize,
    modelName: "AdminRolePermission",
    tableName: "admin_role_permissions"
  }
);

module.exports = AdminRolePermission;
