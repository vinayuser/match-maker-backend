const { Op } = require("sequelize");
const { sequelize, AdminRole, AdminPermission, AdminRolePermission, AdminUserRole } = require("../models");
const { ensureAccessControlSeedData } = require("./adminAccess.service");

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

async function listPermissions() {
  await ensureAccessControlSeedData();
  const rows = await AdminPermission.findAll({
    where: { isActive: true },
    order: [
      ["module", "ASC"],
      ["name", "ASC"]
    ]
  });
  return rows.map((item) => item.get({ plain: true }));
}

async function listRoles() {
  await ensureAccessControlSeedData();
  const roles = await AdminRole.findAll({
    include: [
      {
        model: AdminPermission,
        as: "permissions",
        attributes: ["id", "key", "name", "module"],
        through: { attributes: [] }
      }
    ],
    order: [["name", "ASC"]]
  });

  return Promise.all(
    roles.map(async (role) => {
      const assignedUsers = await AdminUserRole.count({ where: { roleId: role.id } });
      return {
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description || "",
        isSystem: Boolean(role.isSystem),
        isActive: Boolean(role.isActive),
        assignedUsers,
        permissions: (role.permissions || []).map((permission) => permission.get({ plain: true }))
      };
    })
  );
}

async function getRoleById(roleId) {
  const role = await AdminRole.findByPk(roleId, {
    include: [
      {
        model: AdminPermission,
        as: "permissions",
        attributes: ["id", "key", "name", "module"],
        through: { attributes: [] }
      }
    ]
  });
  if (!role) {
    const error = new Error("ROLE_NOT_FOUND");
    error.code = "NOT_FOUND";
    throw error;
  }
  const assignedUsers = await AdminUserRole.count({ where: { roleId: role.id } });
  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description || "",
    isSystem: Boolean(role.isSystem),
    isActive: Boolean(role.isActive),
    assignedUsers,
    permissions: (role.permissions || []).map((permission) => permission.get({ plain: true }))
  };
}

async function createRole({ name, slug, description, isActive, permissionKeys }, creatorId) {
  await ensureAccessControlSeedData();
  const normalizedSlug = normalizeSlug(slug || name);
  if (!normalizedSlug) {
    const error = new Error("INVALID_ROLE_SLUG");
    error.code = "VALIDATION";
    throw error;
  }

  const existing = await AdminRole.findOne({ where: { [Op.or]: [{ slug: normalizedSlug }, { name: name.trim() }] } });
  if (existing) {
    const error = new Error("ROLE_ALREADY_EXISTS");
    error.code = "CONFLICT";
    throw error;
  }

  return sequelize.transaction(async (transaction) => {
    const role = await AdminRole.create(
      {
        name: name.trim(),
        slug: normalizedSlug,
        description: description?.trim() || null,
        isActive: isActive !== false,
        isSystem: false,
        createdBy: creatorId
      },
      { transaction }
    );

    if (Array.isArray(permissionKeys) && permissionKeys.length > 0) {
      const permissions = await AdminPermission.findAll({
        where: { key: { [Op.in]: permissionKeys } },
        transaction
      });
      await AdminRolePermission.bulkCreate(
        permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
        { transaction }
      );
    }

    return getRoleById(role.id);
  });
}

async function updateRole(roleId, payload) {
  const role = await AdminRole.findByPk(roleId);
  if (!role) {
    const error = new Error("ROLE_NOT_FOUND");
    error.code = "NOT_FOUND";
    throw error;
  }
  if (role.isSystem && payload.slug && payload.slug !== role.slug) {
    const error = new Error("SYSTEM_ROLE_SLUG_IMMUTABLE");
    error.code = "FORBIDDEN";
    throw error;
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.slug !== undefined) {
    const normalizedSlug = normalizeSlug(payload.slug);
    if (!normalizedSlug) {
      const err = new Error("INVALID_ROLE_SLUG");
      err.code = "VALIDATION";
      throw err;
    }
    updates.slug = normalizedSlug;
  }
  if (payload.description !== undefined) updates.description = payload.description?.trim() || null;
  if (payload.isActive !== undefined) updates.isActive = Boolean(payload.isActive);

  return sequelize.transaction(async (transaction) => {
    if (Object.keys(updates).length > 0) {
      await role.update(updates, { transaction });
    }

    if (Array.isArray(payload.permissionKeys)) {
      const permissions = payload.permissionKeys.length
        ? await AdminPermission.findAll({
            where: { key: { [Op.in]: payload.permissionKeys } },
            transaction
          })
        : [];

      await AdminRolePermission.destroy({ where: { roleId }, transaction });
      if (permissions.length) {
        await AdminRolePermission.bulkCreate(
          permissions.map((permission) => ({ roleId, permissionId: permission.id })),
          { transaction }
        );
      }
    }

    return getRoleById(roleId);
  });
}

async function deleteRole(roleId) {
  const role = await AdminRole.findByPk(roleId);
  if (!role) {
    const error = new Error("ROLE_NOT_FOUND");
    error.code = "NOT_FOUND";
    throw error;
  }
  if (role.isSystem) {
    const error = new Error("SYSTEM_ROLE_DELETE_NOT_ALLOWED");
    error.code = "FORBIDDEN";
    throw error;
  }

  const assignedUsers = await AdminUserRole.count({ where: { roleId } });
  if (assignedUsers > 0) {
    const error = new Error("ROLE_IN_USE");
    error.code = "CONFLICT";
    throw error;
  }

  await role.destroy();
  return { id: roleId };
}

module.exports = {
  listPermissions,
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};
