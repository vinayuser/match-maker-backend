const AdminTeamService = require("../services/adminTeam.service");
const { isConfigured, uploadProfileImage } = require("../common/cloudinaryClient");
const {
  createMatchmakerTeamMember: createSchema,
  updateMatchmakerTeamMember: updateSchema,
  lockMatchmakerTeamMember: lockSchema
} = require("../validation/admin.validation");

module.exports.listMatchmakers = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = String(req.query.search || "");
    const status = String(req.query.status || "");
    const result = await AdminTeamService.listMatchmakers({ page, limit, search, status });
    return res.success("OK", result);
  } catch (error) {
    return next(error);
  }
};

module.exports.createMatchmaker = async (req, res, next) => {
  try {
    const payload = await createSchema.validateAsync(req.body);
    const matchmaker = await AdminTeamService.createMatchmaker(payload, req.admin.id);
    return res.success("MATCHMAKER_CREATED", { matchmaker });
  } catch (error) {
    if (error.code === "CONFLICT") return res.error(409, error.message);
    if (error.code === "VALIDATION") return res.error(400, error.message);
    return next(error);
  }
};

module.exports.matchmakerDetail = async (req, res, next) => {
  try {
    const adminId = Number(req.params.id);
    if (!Number.isFinite(adminId) || adminId <= 0) {
      return res.error(400, "INVALID_MATCHMAKER_ID");
    }
    const matchmaker = await AdminTeamService.getMatchmakerById(adminId);
    return res.success("OK", { matchmaker });
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    return next(error);
  }
};

module.exports.updateMatchmaker = async (req, res, next) => {
  try {
    const adminId = Number(req.params.id);
    if (!Number.isFinite(adminId) || adminId <= 0) {
      return res.error(400, "INVALID_MATCHMAKER_ID");
    }
    const payload = await updateSchema.validateAsync(req.body);
    const matchmaker = await AdminTeamService.updateMatchmaker(adminId, payload);
    return res.success("MATCHMAKER_UPDATED", { matchmaker });
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    if (error.code === "CONFLICT") return res.error(409, error.message);
    if (error.code === "VALIDATION") return res.error(400, error.message);
    return next(error);
  }
};

module.exports.lockMatchmaker = async (req, res, next) => {
  try {
    const adminId = Number(req.params.id);
    if (!Number.isFinite(adminId) || adminId <= 0) {
      return res.error(400, "INVALID_MATCHMAKER_ID");
    }
    const payload = await lockSchema.validateAsync(req.body);
    const result = await AdminTeamService.setMatchmakerLock(adminId, payload.isLocked);
    return res.success("MATCHMAKER_LOCK_UPDATED", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    return next(error);
  }
};

module.exports.deleteMatchmaker = async (req, res, next) => {
  try {
    const adminId = Number(req.params.id);
    if (!Number.isFinite(adminId) || adminId <= 0) {
      return res.error(400, "INVALID_MATCHMAKER_ID");
    }
    const result = await AdminTeamService.deleteMatchmaker(adminId);
    return res.success("MATCHMAKER_DELETED", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    return next(error);
  }
};

module.exports.uploadMatchmakerAvatar = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return res.error(400, "FILE_REQUIRED");
    }
    if (!isConfigured()) {
      return res.error(503, "CLOUDINARY_NOT_CONFIGURED");
    }

    const result = await uploadProfileImage(req.file.buffer, { userId: `admin_${req.admin.id}` });
    return res.success("UPLOADED", {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    return next(error);
  }
};
