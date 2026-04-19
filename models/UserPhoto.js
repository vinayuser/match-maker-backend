const { DataTypes, Model } = require("sequelize");
const sequelize = require("./sequelize");

class UserPhoto extends Model {}

UserPhoto.init(
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
    imageUrl: {
      type: DataTypes.STRING(1024),
      allowNull: false,
      field: "image_url"
    },
    sortOrder: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 0,
      field: "sort_order"
    },
    isPrimary: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0,
      field: "is_primary"
    },
    moderationStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      field: "moderation_status"
    }
  },
  {
    sequelize,
    modelName: "UserPhoto",
    tableName: "user_photos",
    updatedAt: false
  }
);

module.exports = UserPhoto;
