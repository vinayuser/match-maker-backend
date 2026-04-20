const AdminAuthService = require("../services/adminAuth.service");
const {
  bootstrapSuperAdmin: bootstrapSchema,
  adminLogin: loginSchema
} = require("../validation/admin.validation");

module.exports.bootstrapSuperAdmin = async (req, res, next) => {
  try {
    const payload = await bootstrapSchema.validateAsync(req.body);
    const result = await AdminAuthService.bootstrapSuperAdmin(payload);
    return res.success("SUPER_ADMIN_BOOTSTRAPPED", result);
  } catch (error) {
    if (error.code === "ADMIN_BOOTSTRAP_BLOCKED") {
      return res.error(409, error.message);
    }
    if (error.code === "ADMIN_EXISTS") {
      return res.error(409, error.message);
    }
    return next(error);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const payload = await loginSchema.validateAsync(req.body);
    const result = await AdminAuthService.loginAdmin(payload.email, payload.password);
    return res.success("ADMIN_LOGIN_SUCCESS", result);
  } catch (error) {
    if (error.code === "ADMIN_AUTH") {
      return res.error(401, error.message);
    }
    return next(error);
  }
};

module.exports.me = async (req, res) => {
  return res.success("OK", { admin: req.admin });
};
