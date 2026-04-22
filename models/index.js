const sequelize = require("./sequelize");
const User = require("./User");
const UserProfile = require("./UserProfile");
const UserPhoto = require("./UserPhoto");
const AdminUser = require("./AdminUser");
const AdminRole = require("./AdminRole");
const AdminPermission = require("./AdminPermission");
const AdminRolePermission = require("./AdminRolePermission");
const AdminUserRole = require("./AdminUserRole");
const InterestInvitation = require("./InterestInvitation");
const UserFavorite = require("./UserFavorite");

User.hasOne(UserProfile, { foreignKey: "user_id", as: "profile" });
UserProfile.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(UserPhoto, { foreignKey: "user_id", as: "photos" });
UserPhoto.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(InterestInvitation, { foreignKey: "from_user_id", as: "sentInvitations" });
User.hasMany(InterestInvitation, { foreignKey: "to_user_id", as: "receivedInvitations" });
InterestInvitation.belongsTo(User, { foreignKey: "from_user_id", as: "fromUser" });
InterestInvitation.belongsTo(User, { foreignKey: "to_user_id", as: "toUser" });
User.hasMany(UserFavorite, { foreignKey: "user_id", as: "favorites" });
UserFavorite.belongsTo(User, { foreignKey: "user_id", as: "owner" });
UserFavorite.belongsTo(User, { foreignKey: "favorite_user_id", as: "favoriteUser" });

AdminUser.belongsTo(AdminUser, { foreignKey: "created_by", as: "creator" });
AdminRole.belongsTo(AdminUser, { foreignKey: "created_by", as: "creator" });

AdminRole.belongsToMany(AdminPermission, {
  through: AdminRolePermission,
  as: "permissions",
  foreignKey: "role_id",
  otherKey: "permission_id"
});
AdminPermission.belongsToMany(AdminRole, {
  through: AdminRolePermission,
  as: "roles",
  foreignKey: "permission_id",
  otherKey: "role_id"
});

AdminUser.belongsToMany(AdminRole, {
  through: AdminUserRole,
  as: "roles",
  foreignKey: "admin_user_id",
  otherKey: "role_id"
});
AdminRole.belongsToMany(AdminUser, {
  through: AdminUserRole,
  as: "admins",
  foreignKey: "role_id",
  otherKey: "admin_user_id"
});

module.exports = {
  sequelize,
  User,
  UserProfile,
  UserPhoto,
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminRolePermission,
  AdminUserRole,
  InterestInvitation,
  UserFavorite
};
