const { DataTypes, Model } = require("sequelize");
const sequelize = require("./sequelize");

class AdminPermission extends Model {}

AdminPermission.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    module: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active"
    }
  },
  {
    sequelize,
    modelName: "AdminPermission",
    tableName: "admin_permissions"
  }
);

module.exports = AdminPermission;
