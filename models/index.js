const sequelize = require("./sequelize");
const User = require("./User");
const UserProfile = require("./UserProfile");
const UserPhoto = require("./UserPhoto");
const AdminUser = require("./AdminUser");

User.hasOne(UserProfile, { foreignKey: "user_id", as: "profile" });
UserProfile.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(UserPhoto, { foreignKey: "user_id", as: "photos" });
UserPhoto.belongsTo(User, { foreignKey: "user_id", as: "user" });

AdminUser.belongsTo(AdminUser, { foreignKey: "created_by", as: "creator" });

module.exports = {
  sequelize,
  User,
  UserProfile,
  UserPhoto,
  AdminUser
};
