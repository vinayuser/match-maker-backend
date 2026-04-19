const { DataTypes, Model } = require("sequelize");
const sequelize = require("./sequelize");

class User extends Model {}

User.init(
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
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash"
    }
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users"
  }
);

module.exports = User;
