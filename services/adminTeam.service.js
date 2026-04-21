const bcrypt = require("bcryptjs");
const { Op, QueryTypes } = require("sequelize");
const { sequelize, AdminUser, AdminRole, AdminUserRole } = require("../models");
const { ensureAccessControlSeedData, getAdminAccessProfile } = require("./adminAccess.service");

async function listMatchmakers({ page = 1, limit = 10, search = "", status = "" }) {
  await ensureAccessControlSeedData();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  const offset = (safePage - 1) * safeLimit;

  const where = { role: "matchmaker_admin" };
  if (status === "active") where.isActive = true;
  if (status === "locked") where.isActive = false;
  if (search.trim()) {
    const query = `%${search.trim()}%`;
    where[Op.or] = [{ name: { [Op.like]: query } }, { email: { [Op.like]: query } }];
  }

  const result = await AdminUser.findAndCountAll({
    where,
    attributes: [
      "id",
      "name",
      "avatarUrl",
      "email",
      "isActive",
      "lastLoginAt",
      [sequelize.col("AdminUser.created_at"), "createdAt"]
    ],
    include: [
      {
        model: AdminRole,
        as: "roles",
        attributes: ["id", "name", "slug"],
        through: { attributes: [] }
      }
    ],
    order: [[sequelize.literal("`AdminUser`.`created_at`"), "DESC"]],
    subQuery: false,
    distinct: true,
    limit: safeLimit,
    offset
  });

  const matchmakerIds = result.rows.map((row) => row.id);
  let performanceMap = new Map();
  if (matchmakerIds.length) {
    const performanceRows = await sequelize.query(
      `
      SELECT
        m.matchmaker_id AS matchmakerId,
        SUM(CASE WHEN m.status = 'active' THEN 1 ELSE 0 END) AS activeCases,
        SUM(CASE WHEN m.status = 'closed' THEN 1 ELSE 0 END) AS closedCases,
        COUNT(*) AS totalCases
      FROM matches m
      WHERE m.matchmaker_id IN (:matchmakerIds)
      GROUP BY m.matchmaker_id
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { matchmakerIds }
      }
    );
    performanceMap = new Map(
      performanceRows.map((row) => [
        Number(row.matchmakerId),
        {
          activeCases: Number(row.activeCases || 0),
          closedCases: Number(row.closedCases || 0),
          totalCases: Number(row.totalCases || 0)
        }
      ])
    );
  }

  const rows = await Promise.all(
    result.rows.map(async (row) => {
      const perf = performanceMap.get(Number(row.id)) || { activeCases: 0, closedCases: 0, totalCases: 0 };
      const successRate = perf.totalCases > 0 ? Math.round((perf.closedCases / perf.totalCases) * 100) : 0;
      const access = await getAdminAccessProfile(row.id);
      return {
        id: row.id,
        name: row.name,
        avatarUrl: row.avatarUrl || null,
        email: row.email,
        isActive: Boolean(row.isActive),
        isLocked: !row.isActive,
        lastLoginAt: row.lastLoginAt,
        createdAt: row.get("createdAt"),
        activeCases: perf.activeCases,
        closedCases: perf.closedCases,
        totalCases: perf.totalCases,
        successRate,
        roles: access?.roles || [],
        permissions: access?.effectivePermissions || []
      };
    })
  );

  return {
    rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      totalPages: Math.max(1, Math.ceil(result.count / safeLimit))
    }
  };
}

async function createMatchmaker({ name, email, password, avatarUrl, roleIds = [], permissions = [] }, creatorId) {
  await ensureAccessControlSeedData();
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await AdminUser.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error("ADMIN_EMAIL_ALREADY_REGISTERED");
    error.code = "CONFLICT";
    throw error;
  }

  const roles = roleIds.length ? await AdminRole.findAll({ where: { id: { [Op.in]: roleIds }, isActive: true } }) : [];
  if (roleIds.length && roles.length !== roleIds.length) {
    const error = new Error("INVALID_ROLE_SELECTION");
    error.code = "VALIDATION";
    throw error;
  }

  return sequelize.transaction(async (transaction) => {
    const admin = await AdminUser.create(
      {
        name: name.trim(),
        avatarUrl: (avatarUrl || "").trim() || null,
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        role: "matchmaker_admin",
        permissions,
        createdBy: creatorId,
        isActive: true
      },
      { transaction }
    );

    if (roles.length) {
      await AdminUserRole.bulkCreate(
        roles.map((role) => ({
          adminUserId: admin.id,
          roleId: role.id
        })),
        { transaction }
      );
    }

    const access = await getAdminAccessProfile(admin.id);
    return {
      id: admin.id,
      name: admin.name,
      avatarUrl: admin.avatarUrl || null,
      email: admin.email,
      isActive: Boolean(admin.isActive),
      isLocked: !admin.isActive,
      roles: access?.roles || [],
      permissions: access?.effectivePermissions || []
    };
  });
}

async function getMatchmakerById(adminId) {
  const admin = await AdminUser.findByPk(adminId, {
    attributes: [
      "id",
      "name",
      "avatarUrl",
      "email",
      "isActive",
      "lastLoginAt",
      [sequelize.col("AdminUser.created_at"), "createdAt"],
      "role"
    ]
  });
  if (!admin || admin.role !== "matchmaker_admin") {
    const error = new Error("MATCHMAKER_NOT_FOUND");
    error.code = "NOT_FOUND";
    throw error;
  }
  const access = await getAdminAccessProfile(admin.id);
  return {
    id: admin.id,
    name: admin.name,
    avatarUrl: admin.avatarUrl || null,
    email: admin.email,
    isActive: Boolean(admin.isActive),
    isLocked: !admin.isActive,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.get("createdAt"),
    roles: access?.roles || [],
    permissions: access?.effectivePermissions || []
  };
}

async function updateMatchmaker(adminId, payload) {
  const admin = await AdminUser.findByPk(adminId);
  if (!admin || admin.role !== "matchmaker_admin") {
    const error = new Error("MATCHMAKER_NOT_FOUND");
    error.code = "NOT_FOUND";
    throw error;
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.avatarUrl !== undefined) updates.avatarUrl = payload.avatarUrl?.trim() || null;
  if (payload.email !== undefined) updates.email = payload.email.toLowerCase().trim();
  if (payload.permissions !== undefined) updates.permissions = payload.permissions;
  if (payload.password !== undefined) updates.passwordHash = await bcrypt.hash(payload.password, 12);

  if (updates.email) {
    const existing = await AdminUser.findOne({
      where: {
        email: updates.email,
        id: { [Op.ne]: admin.id }
      }
    });
    if (existing) {
      const error = new Error("ADMIN_EMAIL_ALREADY_REGISTERED");
      error.code = "CONFLICT";
      throw error;
    }
  }

  await sequelize.transaction(async (transaction) => {
    if (Object.keys(updates).length > 0) {
      await admin.update(updates, { transaction });
    }

    if (Array.isArray(payload.roleIds)) {
      const roles = payload.roleIds.length
        ? await AdminRole.findAll({ where: { id: { [Op.in]: payload.roleIds }, isActive: true }, transaction })
        : [];
      if (payload.roleIds.length && roles.length !== payload.roleIds.length) {
        const error = new Error("INVALID_ROLE_SELECTION");
        error.code = "VALIDATION";
        throw error;
      }
      await AdminUserRole.destroy({ where: { adminUserId: admin.id }, transaction });
      if (roles.length) {
        await AdminUserRole.bulkCreate(
          roles.map((role) => ({
            adminUserId: admin.id,
            roleId: role.id
          })),
          { transaction }
        );
      }
    }
  });

  return getMatchmakerById(admin.id);
}

async function setMatchmakerLock(adminId, isLocked) {
  const admin = await AdminUser.findByPk(adminId);
  if (!admin || admin.role !== "matchmaker_admin") {
    const error = new Error("MATCHMAKER_NOT_FOUND");
    error.code = "NOT_FOUND";
    throw error;
  }
  await admin.update({ isActive: !isLocked });
  return {
    id: admin.id,
    isActive: Boolean(admin.isActive),
    isLocked: !admin.isActive
  };
}

async function deleteMatchmaker(adminId) {
  const admin = await AdminUser.findByPk(adminId);
  if (!admin || admin.role !== "matchmaker_admin") {
    const error = new Error("MATCHMAKER_NOT_FOUND");
    error.code = "NOT_FOUND";
    throw error;
  }
  await admin.destroy();
  return { id: adminId };
}

module.exports = {
  listMatchmakers,
  createMatchmaker,
  getMatchmakerById,
  updateMatchmaker,
  setMatchmakerLock,
  deleteMatchmaker
};
