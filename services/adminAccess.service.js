const { Op } = require("sequelize");
const {
  sequelize,
  AdminPermission,
  AdminRole,
  AdminRolePermission,
  AdminUser,
  AdminUserRole
} = require("../models");

const DEFAULT_PERMISSIONS = [
  { key: "dashboard:view", name: "View Dashboard", module: "dashboard" },
  { key: "approval_queue:view", name: "View Approval Queue", module: "approvals" },
  { key: "approval_queue:review", name: "Review Approval Queue", module: "approvals" },
  { key: "verified_users:view", name: "View Verified Users", module: "users" },
  { key: "verified_users:update", name: "Update Verified Users", module: "users" },
  { key: "verified_users:lock", name: "Lock Verified Users", module: "users" },
  { key: "team:view", name: "View Matchmaker Team", module: "team" },
  { key: "team:create", name: "Create Matchmaker", module: "team" },
  { key: "team:update", name: "Update Matchmaker", module: "team" },
  { key: "team:lock", name: "Lock Matchmaker", module: "team" },
  { key: "team:delete", name: "Delete Matchmaker", module: "team" },
  { key: "roles:view", name: "View Roles", module: "roles" },
  { key: "roles:create", name: "Create Role", module: "roles" },
  { key: "roles:update", name: "Update Role", module: "roles" },
  { key: "roles:delete", name: "Delete Role", module: "roles" }
];

const DEFAULT_ROLES = [
  {
    slug: "matchmaker_reviewer",
    name: "Matchmaker Reviewer",
    description: "Can review approval queue and view members.",
    permissions: ["dashboard:view", "approval_queue:view", "approval_queue:review", "verified_users:view", "team:view"]
  },
  {
    slug: "matchmaker_manager",
    name: "Matchmaker Manager",
    description: "Can review and manage verified members.",
    permissions: [
      "dashboard:view",
      "approval_queue:view",
      "approval_queue:review",
      "verified_users:view",
      "verified_users:update",
      "verified_users:lock",
      "team:view"
    ]
  }
];

async function ensureAccessControlSeedData() {
  await sequelize.transaction(async (transaction) => {
    for (const permission of DEFAULT_PERMISSIONS) {
      const existing = await AdminPermission.findOne({
        where: { key: permission.key },
        transaction
      });
      if (!existing) {
        await AdminPermission.create(permission, { transaction });
      }
    }

    const allPermissions = await AdminPermission.findAll({
      where: { key: { [Op.in]: DEFAULT_PERMISSIONS.map((item) => item.key) } },
      transaction
    });
    const permissionByKey = new Map(allPermissions.map((item) => [item.key, item]));

    for (const roleConfig of DEFAULT_ROLES) {
      const [role, created] = await AdminRole.findOrCreate({
        where: { slug: roleConfig.slug },
        defaults: {
          name: roleConfig.name,
          slug: roleConfig.slug,
          description: roleConfig.description,
          isSystem: true,
          isActive: true
        },
        transaction
      });

      if (created) {
        const rolePermissions = roleConfig.permissions
          .map((key) => permissionByKey.get(key))
          .filter(Boolean);
        await AdminRolePermission.bulkCreate(
          rolePermissions.map((item) => ({
            roleId: role.id,
            permissionId: item.id
          })),
          { transaction }
        );
      }
    }
  });
}

async function getAdminAccessProfile(adminId) {
  const admin = await AdminUser.findByPk(adminId, {
    include: [
      {
        model: AdminRole,
        as: "roles",
        attributes: ["id", "name", "slug", "description", "isActive"],
        through: { attributes: [] },
        include: [
          {
            model: AdminPermission,
            as: "permissions",
            attributes: ["id", "key", "name", "module"],
            through: { attributes: [] }
          }
        ]
      }
    ]
  });

  if (!admin) return null;

  const directPermissions = Array.isArray(admin.permissions) ? admin.permissions : [];
  const rolePermissions = (admin.roles || [])
    .flatMap((role) => role.permissions || [])
    .map((permission) => permission.key);

  const effectivePermissions = [...new Set([...directPermissions, ...rolePermissions])];

  return {
    admin,
    roles: (admin.roles || []).map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isActive: role.isActive
    })),
    effectivePermissions
  };
}

module.exports = {
  DEFAULT_PERMISSIONS,
  ensureAccessControlSeedData,
  getAdminAccessProfile
};
