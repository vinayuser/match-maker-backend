const { DataTypes, Model } = require("sequelize");
const sequelize = require("./sequelize");

class UserFavorite extends Model {}

UserFavorite.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "user_id"
    },
    favoriteUserId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "favorite_user_id"
    }
  },
  {
    sequelize,
    modelName: "UserFavorite",
    tableName: "user_favorites"
  }
);

module.exports = UserFavorite;
