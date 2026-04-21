const AdminRoleService = require("../services/adminRole.service");
const {
  createAdminRole: createRoleSchema,
  updateAdminRole: updateRoleSchema
} = require("../validation/admin.validation");

module.exports.listPermissions = async (req, res, next) => {
  try {
    const permissions = await AdminRoleService.listPermissions();
    return res.success("OK", { permissions });
  } catch (error) {
    return next(error);
  }
};

module.exports.listRoles = async (req, res, next) => {
  try {
    const roles = await AdminRoleService.listRoles();
    return res.success("OK", { roles });
  } catch (error) {
    return next(error);
  }
};

module.exports.roleDetail = async (req, res, next) => {
  try {
    const roleId = Number(req.params.id);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return res.error(400, "INVALID_ROLE_ID");
    }
    const role = await AdminRoleService.getRoleById(roleId);
    return res.success("OK", { role });
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    return next(error);
  }
};

module.exports.createRole = async (req, res, next) => {
  try {
    const payload = await createRoleSchema.validateAsync(req.body);
    const role = await AdminRoleService.createRole(payload, req.admin.id);
    return res.success("ROLE_CREATED", { role });
  } catch (error) {
    if (error.code === "CONFLICT") return res.error(409, error.message);
    if (error.code === "VALIDATION") return res.error(400, error.message);
    return next(error);
  }
};

module.exports.updateRole = async (req, res, next) => {
  try {
    const roleId = Number(req.params.id);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return res.error(400, "INVALID_ROLE_ID");
    }
    const payload = await updateRoleSchema.validateAsync(req.body);
    const role = await AdminRoleService.updateRole(roleId, payload);
    return res.success("ROLE_UPDATED", { role });
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    if (error.code === "CONFLICT") return res.error(409, error.message);
    if (error.code === "VALIDATION") return res.error(400, error.message);
    if (error.code === "FORBIDDEN") return res.error(403, error.message);
    return next(error);
  }
};

module.exports.deleteRole = async (req, res, next) => {
  try {
    const roleId = Number(req.params.id);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      return res.error(400, "INVALID_ROLE_ID");
    }
    const result = await AdminRoleService.deleteRole(roleId);
    return res.success("ROLE_DELETED", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    if (error.code === "CONFLICT") return res.error(409, error.message);
    if (error.code === "FORBIDDEN") return res.error(403, error.message);
    return next(error);
  }
};
