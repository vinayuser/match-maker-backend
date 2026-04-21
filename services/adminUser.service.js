const bcrypt = require("bcryptjs");
const { Op, QueryTypes } = require("sequelize");
const { AdminUser, User, UserProfile, UserPhoto, sequelize } = require("../models");

let adminUsersColumnCache = null;

async function getAdminUsersColumnNames() {
  if (adminUsersColumnCache) return adminUsersColumnCache;
  const table = await sequelize.getQueryInterface().describeTable("admin_users");
  adminUsersColumnCache = {
    created: table.created_at ? "created_at" : "createdAt",
    lastLogin: table.last_login_at ? "last_login_at" : "lastLoginAt"
  };
  return adminUsersColumnCache;
}

function sanitizeAdmin(admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
    isActive: admin.isActive,
    createdBy: admin.createdBy,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt
  };
}

async function createMatchmakerAdmin(payload, creatorId) {
  const email = payload.email.toLowerCase().trim();
  const existing = await AdminUser.findOne({ where: { email } });
  if (existing) {
    const error = new Error("ADMIN_EMAIL_ALREADY_REGISTERED");
    error.code = "ADMIN_EXISTS";
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const admin = await AdminUser.create({
    email,
    passwordHash,
    name: payload.name.trim(),
    role: "matchmaker_admin",
    permissions: payload.permissions || [],
    createdBy: creatorId,
    isActive: true
  });

  return sanitizeAdmin(admin);
}

async function listAdmins() {
  const adminCols = await getAdminUsersColumnNames();
  const admins = await AdminUser.findAll({
    attributes: [
      "id",
      "email",
      "name",
      "role",
      "permissions",
      "isActive",
      "createdBy",
      [sequelize.col(`AdminUser.${adminCols.lastLogin}`), "lastLoginAt"],
      [sequelize.col(`AdminUser.${adminCols.created}`), "createdAt"]
    ],
    order: [[sequelize.col(`AdminUser.${adminCols.created}`), "DESC"]]
  });

  return admins.map(sanitizeAdmin);
}

async function updateMatchmakerAdmin(adminId, payload) {
  const admin = await AdminUser.findByPk(adminId);
  if (!admin) {
    const error = new Error("ADMIN_NOT_FOUND");
    error.code = "NOT_FOUND";
    throw error;
  }

  if (admin.role === "super_admin" && (payload.role || payload.permissions || payload.isActive !== undefined)) {
    const error = new Error("SUPER_ADMIN_UPDATE_NOT_ALLOWED");
    error.code = "ADMIN_FORBIDDEN";
    throw error;
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.permissions !== undefined) updates.permissions = payload.permissions;
  if (payload.isActive !== undefined) updates.isActive = payload.isActive;
  if (payload.role !== undefined) updates.role = payload.role;
  if (payload.password !== undefined) {
    updates.passwordHash = await bcrypt.hash(payload.password, 12);
  }

  await admin.update(updates);
  return sanitizeAdmin(admin);
}

async function listApprovalQueue({ page = 1, limit = 10 }) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  const offset = (safePage - 1) * safeLimit;

  const result = await UserProfile.findAndCountAll({
    where: { profileStatus: "pending_review" },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email"],
        required: true
      }
    ],
    attributes: [
      "userId",
      "firstName",
      "lastName",
      "gender",
      "city",
      "country",
      "religiousLevel",
      "profileStatus",
      "verificationStatus",
      "onboardingCompletedAt",
      [sequelize.col("UserProfile.updated_at"), "updatedAt"]
    ],
    order: [["onboardingCompletedAt", "ASC"]],
    limit: safeLimit,
    offset
  });

  const profiles = result.rows.map((row) => ({
    userId: row.userId,
    email: row.user?.email || null,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: `${row.firstName || ""} ${row.lastName || ""}`.trim(),
    gender: row.gender,
    city: row.city,
    country: row.country,
    religiousLevel: row.religiousLevel,
    profileStatus: row.profileStatus,
    verificationStatus: row.verificationStatus,
    onboardingCompletedAt: row.onboardingCompletedAt,
    updatedAt: row.get("updatedAt")
  }));

  return {
    profiles,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      totalPages: Math.max(1, Math.ceil(result.count / safeLimit))
    }
  };
}

async function reviewUserProfile({ userId, decision, note, reviewerAdminId }) {
  const t = await sequelize.transaction();
  try {
    const profile = await UserProfile.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!profile) {
      const err = new Error("USER_PROFILE_NOT_FOUND");
      err.code = "NOT_FOUND";
      throw err;
    }

    const internalNotes = [profile.internalNotes, note && `[admin:${reviewerAdminId}] ${note}`]
      .filter(Boolean)
      .join("\n");

    if (decision === "approve") {
      await profile.update(
        {
          profileStatus: "active",
          verificationStatus: "verified",
          internalNotes
        },
        { transaction: t }
      );
    } else {
      await profile.update(
        {
          profileStatus: "draft",
          verificationStatus: "rejected",
          internalNotes
        },
        { transaction: t }
      );
    }

    await t.commit();
    return {
      userId: profile.userId,
      profileStatus: profile.profileStatus,
      verificationStatus: profile.verificationStatus
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function getApprovalProfileDetail(userId) {
  const user = await User.findByPk(userId, {
    attributes: ["id", "email", [sequelize.col("User.created_at"), "createdAt"]],
    include: [
      {
        model: UserProfile,
        as: "profile"
      },
      {
        model: UserPhoto,
        as: "photos",
        attributes: ["id", "imageUrl", "sortOrder", "isPrimary", "moderationStatus"],
        required: false
      }
    ]
  });

  if (!user || !user.profile) {
    const err = new Error("USER_PROFILE_NOT_FOUND");
    err.code = "NOT_FOUND";
    throw err;
  }

  const profile = user.profile.get({ plain: true });
  const photos = (user.photos || []).map((photo) => photo.get({ plain: true }));

  return {
    userId: user.id,
    email: user.email,
    createdAt: user.get("createdAt"),
    profile,
    photos
  };
}

async function getManagedUserDetail(userId) {
  return getApprovalProfileDetail(userId);
}

async function updateManagedUserProfile(userId, payload) {
  const profile = await UserProfile.findByPk(userId);
  if (!profile) {
    const err = new Error("USER_PROFILE_NOT_FOUND");
    err.code = "NOT_FOUND";
    throw err;
  }

  const updates = {};
  if (payload.firstName !== undefined) updates.firstName = payload.firstName || null;
  if (payload.lastName !== undefined) updates.lastName = payload.lastName || null;
  if (payload.phone !== undefined) updates.phone = payload.phone || null;
  if (payload.city !== undefined) updates.city = payload.city || null;
  if (payload.country !== undefined) updates.country = payload.country || null;
  if (payload.religiousLevel !== undefined) updates.religiousLevel = payload.religiousLevel || null;
  if (payload.profileStatus !== undefined) updates.profileStatus = payload.profileStatus;

  await profile.update(updates);
  return {
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    city: profile.city,
    country: profile.country,
    religiousLevel: profile.religiousLevel,
    profileStatus: profile.profileStatus
  };
}

async function setManagedUserLock(userId, isLocked) {
  const profile = await UserProfile.findByPk(userId);
  if (!profile) {
    const err = new Error("USER_PROFILE_NOT_FOUND");
    err.code = "NOT_FOUND";
    throw err;
  }

  const nextValues = { isLocked: isLocked ? 1 : 0 };
  if (isLocked && profile.profileStatus === "active") {
    nextValues.profileStatus = "paused";
  }
  if (!isLocked && profile.profileStatus === "paused") {
    nextValues.profileStatus = "active";
  }

  await profile.update(nextValues);
  return {
    userId: profile.userId,
    isLocked: Boolean(profile.isLocked),
    profileStatus: profile.profileStatus
  };
}

async function listVerifiedUsers({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  religiousLevel = ""
}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  const offset = (safePage - 1) * safeLimit;

  const where = {
    verificationStatus: "verified"
  };

  if (status) {
    where.profileStatus = status;
  }

  if (religiousLevel) {
    where.religiousLevel = religiousLevel;
  }

  const userWhere = {};
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    where[Op.or] = [
      { firstName: { [Op.like]: q } },
      { lastName: { [Op.like]: q } }
    ];
    userWhere.email = { [Op.like]: q };
  }

  const result = await UserProfile.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email"],
        where: userWhere,
        required: true
      }
    ],
    attributes: [
      "userId",
      "firstName",
      "lastName",
      "phone",
      "religiousLevel",
      "profileStatus",
      "verificationStatus",
      "isLocked",
      [sequelize.col("UserProfile.updated_at"), "updatedAt"]
    ],
    order: [[sequelize.col("UserProfile.updated_at"), "DESC"]],
    limit: safeLimit,
    offset
  });

  const users = result.rows.map((row) => {
    const email = row.user?.email || "";
    const maskedEmail = email
      ? email.replace(/^(.{3}).+(@.*)$/, (_, start, end) => `${start}****${end}`)
      : "";
    return {
      userId: row.userId,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: `${row.firstName || ""} ${row.lastName || ""}`.trim(),
      email,
      maskedEmail,
      phone: row.phone || "",
      religiousLevel: row.religiousLevel || "",
      profileStatus: row.profileStatus || "",
      verificationStatus: row.verificationStatus || "",
      isLocked: Boolean(row.isLocked),
      updatedAt: row.get("updatedAt")
    };
  });

  return {
    users,
    filters: {
      search,
      status,
      religiousLevel
    },
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      totalPages: Math.max(1, Math.ceil(result.count / safeLimit))
    }
  };
}

function getHoursAgoLabel(inputDate) {
  if (!inputDate) return "N/A";
  const diffMs = Date.now() - new Date(inputDate).getTime();
  const safeMs = Number.isFinite(diffMs) ? Math.max(0, diffMs) : 0;
  const hours = Math.floor(safeMs / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(safeMs / (1000 * 60)));
    return `${mins}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function getAdminDashboardData() {
  const [
    totalRegisteredUsers,
    pendingProfileApprovals,
    verifiedUsers,
    lockedUsers,
    pendingStats,
    activeMatchesResult,
    closedMatchesThisMonthResult,
    recentRegistrationsRaw,
    criticalQueueRaw,
    matchmakerRows
  ] = await Promise.all([
    User.count(),
    UserProfile.count({ where: { profileStatus: "pending_review" } }),
    UserProfile.count({ where: { verificationStatus: "verified" } }),
    UserProfile.count({ where: { isLocked: 1 } }),
    UserProfile.findOne({
      where: { profileStatus: "pending_review" },
      attributes: [[sequelize.fn("MIN", sequelize.col("onboarding_completed_at")), "oldestPendingAt"]],
      raw: true
    }),
    sequelize.query("SELECT COUNT(*) AS count FROM matches WHERE status = 'active'", {
      type: QueryTypes.SELECT
    }),
    sequelize.query(
      `
      SELECT COUNT(*) AS count
      FROM matches
      WHERE status = 'closed'
        AND updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        AND updated_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
      `,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `
      SELECT
        u.id AS userId,
        u.email AS email,
        u.created_at AS createdAt,
        up.first_name AS firstName,
        up.last_name AS lastName,
        up.religious_level AS religiousLevel
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 6
      `,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `
      SELECT
        up.user_id AS userId,
        u.email AS email,
        up.first_name AS firstName,
        up.last_name AS lastName,
        up.religious_level AS religiousLevel,
        up.onboarding_completed_at AS onboardingCompletedAt,
        TIMESTAMPDIFF(HOUR, up.onboarding_completed_at, NOW()) AS waitingHours
      FROM user_profiles up
      INNER JOIN users u ON u.id = up.user_id
      WHERE up.profile_status = 'pending_review'
      ORDER BY up.onboarding_completed_at ASC
      LIMIT 3
      `,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `
      SELECT
        a.id AS adminId,
        a.name AS name,
        a.email AS email,
        COALESCE(m.active_cases, 0) AS activeCases,
        COALESCE(m.closed_cases, 0) AS closedCases,
        COALESCE(m.total_cases, 0) AS totalCases,
        COALESCE(p.assigned_profiles, 0) AS assignedProfiles
      FROM admin_users a
      LEFT JOIN (
        SELECT
          matchmaker_id,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_cases,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_cases,
          COUNT(*) AS total_cases
        FROM matches
        WHERE matchmaker_id IS NOT NULL
        GROUP BY matchmaker_id
      ) m ON m.matchmaker_id = a.id
      LEFT JOIN (
        SELECT
          assigned_matchmaker_id AS matchmaker_id,
          COUNT(*) AS assigned_profiles
        FROM user_profiles
        WHERE assigned_matchmaker_id IS NOT NULL
        GROUP BY assigned_matchmaker_id
      ) p ON p.matchmaker_id = a.id
      WHERE a.role = 'matchmaker_admin' AND a.is_active = 1
      ORDER BY activeCases DESC, closedCases DESC, a.created_at ASC
      LIMIT 8
      `,
      { type: QueryTypes.SELECT }
    )
  ]);

  const oldestPendingAt = pendingStats?.oldestPendingAt || null;
  const activeMatches = Number(activeMatchesResult?.[0]?.count || 0);
  const closedMatchesThisMonth = Number(closedMatchesThisMonthResult?.[0]?.count || 0);

  const recentRegistrations = recentRegistrationsRaw.map((row) => ({
    userId: Number(row.userId),
    email: row.email || "",
    firstName: row.firstName || "",
    lastName: row.lastName || "",
    fullName: `${row.firstName || ""} ${row.lastName || ""}`.trim() || "Unnamed User",
    religiousLevel: row.religiousLevel || "Not set",
    createdAt: row.createdAt
  }));

  const criticalQueue = criticalQueueRaw.map((row) => ({
    userId: Number(row.userId),
    email: row.email || "",
    firstName: row.firstName || "",
    lastName: row.lastName || "",
    fullName: `${row.firstName || ""} ${row.lastName || ""}`.trim() || "Unnamed User",
    religiousLevel: row.religiousLevel || "Not set",
    onboardingCompletedAt: row.onboardingCompletedAt,
    waitingHours: Number(row.waitingHours || 0)
  }));

  const matchmakerPerformance = matchmakerRows.map((row) => {
    const totalCases = Number(row.totalCases || 0);
    const closedCases = Number(row.closedCases || 0);
    const successRate = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;

    return {
      adminId: Number(row.adminId),
      name: row.name || "Matchmaker",
      email: row.email || "",
      activeCases: Number(row.activeCases || 0),
      closedCases,
      totalCases,
      assignedProfiles: Number(row.assignedProfiles || 0),
      successRate
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      totalRegisteredUsers,
      pendingProfileApprovals,
      oldestPendingAt,
      oldestPendingLabel: getHoursAgoLabel(oldestPendingAt),
      activeMatches,
      closedMatchesThisMonth,
      verifiedUsers,
      lockedUsers
    },
    recentRegistrations,
    criticalQueue,
    matchmakerPerformance
  };
}

module.exports = {
  createMatchmakerAdmin,
  listAdmins,
  updateMatchmakerAdmin,
  getAdminDashboardData,
  listApprovalQueue,
  reviewUserProfile,
  getApprovalProfileDetail,
  listVerifiedUsers,
  getManagedUserDetail,
  updateManagedUserProfile,
  setManagedUserLock
};
