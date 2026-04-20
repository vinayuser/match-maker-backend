const AdminUserService = require("../services/adminUser.service");
const {
  createMatchmakerAdmin: createSchema,
  updateMatchmakerAdmin: updateSchema,
  reviewUserProfile: reviewSchema,
  updateManagedUserProfile: updateManagedSchema,
  setManagedUserLock: lockSchema
} = require("../validation/admin.validation");

module.exports.create = async (req, res, next) => {
  try {
    const payload = await createSchema.validateAsync(req.body);
    const admin = await AdminUserService.createMatchmakerAdmin(payload, req.admin.id);
    return res.success("ADMIN_CREATED", { admin });
  } catch (error) {
    if (error.code === "ADMIN_EXISTS") {
      return res.error(409, error.message);
    }
    return next(error);
  }
};

module.exports.list = async (req, res, next) => {
  try {
    const admins = await AdminUserService.listAdmins();
    return res.success("OK", { admins });
  } catch (error) {
    return next(error);
  }
};

module.exports.update = async (req, res, next) => {
  try {
    const payload = await updateSchema.validateAsync(req.body);
    const adminId = Number(req.params.id);
    const admin = await AdminUserService.updateMatchmakerAdmin(adminId, payload);
    return res.success("ADMIN_UPDATED", { admin });
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.error(404, error.message);
    }
    if (error.code === "ADMIN_FORBIDDEN") {
      return res.error(403, error.message);
    }
    return next(error);
  }
};

module.exports.approvalQueue = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const result = await AdminUserService.listApprovalQueue({ page, limit });
    return res.success("OK", result);
  } catch (error) {
    return next(error);
  }
};

module.exports.reviewProfile = async (req, res, next) => {
  try {
    const payload = await reviewSchema.validateAsync(req.body);
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.error(400, "INVALID_USER_ID");
    }
    const result = await AdminUserService.reviewUserProfile({
      userId,
      decision: payload.decision,
      note: payload.note,
      reviewerAdminId: req.admin.id
    });
    return res.success("PROFILE_REVIEWED", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.error(404, error.message);
    }
    return next(error);
  }
};

module.exports.profileDetail = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.error(400, "INVALID_USER_ID");
    }
    const detail = await AdminUserService.getApprovalProfileDetail(userId);
    return res.success("OK", { detail });
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.error(404, error.message);
    }
    return next(error);
  }
};

module.exports.verifiedUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = String(req.query.search || "");
    const status = String(req.query.status || "");
    const religiousLevel = String(req.query.religiousLevel || "");

    const result = await AdminUserService.listVerifiedUsers({
      page,
      limit,
      search,
      status,
      religiousLevel
    });
    return res.success("OK", result);
  } catch (error) {
    return next(error);
  }
};

module.exports.dashboard = async (req, res, next) => {
  try {
    const dashboard = await AdminUserService.getAdminDashboardData();
    return res.success("OK", { dashboard });
  } catch (error) {
    return next(error);
  }
};

module.exports.verifiedUserDetail = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.error(400, "INVALID_USER_ID");
    }
    const detail = await AdminUserService.getManagedUserDetail(userId);
    return res.success("OK", { detail });
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.error(404, error.message);
    }
    return next(error);
  }
};

module.exports.updateVerifiedUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.error(400, "INVALID_USER_ID");
    }
    const payload = await updateManagedSchema.validateAsync(req.body);
    const result = await AdminUserService.updateManagedUserProfile(userId, payload);
    return res.success("USER_PROFILE_UPDATED", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.error(404, error.message);
    }
    return next(error);
  }
};

module.exports.lockVerifiedUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.error(400, "INVALID_USER_ID");
    }
    const payload = await lockSchema.validateAsync(req.body);
    const result = await AdminUserService.setManagedUserLock(userId, payload.isLocked);
    return res.success("USER_LOCK_UPDATED", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      return res.error(404, error.message);
    }
    return next(error);
  }
};
