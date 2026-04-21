const { DataTypes, Model } = require("sequelize");
const sequelize = require("./sequelize");

class InterestInvitation extends Model {}

InterestInvitation.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    fromUserId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "from_user_id"
    },
    toUserId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "to_user_id"
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "declined", "cancelled"),
      allowNull: false,
      defaultValue: "pending"
    }
  },
  {
    sequelize,
    modelName: "InterestInvitation",
    tableName: "interest_invitations"
  }
);

module.exports = InterestInvitation;
