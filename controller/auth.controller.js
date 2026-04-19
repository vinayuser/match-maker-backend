const AuthService = require("../services/auth.service");
const { signToken } = require("../common/authenticate");
const { register: registerSchema, login: loginSchema } = require("../validation/auth.validation");

module.exports.register = async (req, res, next) => {
  try {
    const body = await registerSchema.validateAsync(req.body);
    const existing = await AuthService.findByEmail(body.email);
    if (existing) {
      return res.error(409, "EMAIL_ALREADY_REGISTERED");
    }
    const user = await AuthService.createUser(body.email, body.password);
    const token = signToken({ sub: user.id, userId: user.id, email: user.email });
    return res.success("REGISTERED", {
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY" || e.errno === 1062) {
      return res.error(409, "EMAIL_ALREADY_REGISTERED");
    }
    next(e);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const body = await loginSchema.validateAsync(req.body);
    const result = await AuthService.login(body.email, body.password);
    return res.success("LOGIN_SUCCESS", result);
  } catch (e) {
    if (e.code === "AUTH") {
      return res.error(401, e.message);
    }
    if (e.code === "AUTH_VERIFICATION") {
      return res.error(403, e.message, {
        profileStatus: e.profileStatus,
        verificationStatus: e.verificationStatus
      });
    }
    next(e);
  }
};

module.exports.me = async (req, res) => {
  return res.success("OK", { user: req.user });
};
