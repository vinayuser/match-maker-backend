const jwt = require("jsonwebtoken");
const { AdminUser } = require("../models");

function getBearerToken(req) {
  const raw = req.headers.authorization || req.headers.Authorization || "";
  return String(raw)
    .replace(/bearer\s+/i, "")
    .trim();
}

function getAdminJwtSecret() {
  return process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
}

function signAdminToken(payload) {
  const secret = getAdminJwtSecret();
  if (!secret) throw new Error("ADMIN_JWT_SECRET or JWT_SECRET not set");

  const options = { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "30d" };
  return jwt.sign(payload, secret, options);
}

async function authenticateAdmin(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.error(401, "ADMIN_UNAUTHORIZED");
    }

    const secret = getAdminJwtSecret();
    if (!secret) {
      return res.error(500, "Server misconfiguration: ADMIN_JWT_SECRET/JWT_SECRET missing");
    }

    const decoded = jwt.verify(token, secret);
    if (decoded.tokenType !== "admin") {
      return res.error(401, "INVALID_ADMIN_TOKEN");
    }

    const adminId = decoded.sub || decoded.adminId;
    if (!adminId) {
      return res.error(401, "INVALID_ADMIN_TOKEN");
    }

    const admin = await AdminUser.findByPk(adminId, {
      attributes: ["id", "email", "name", "role", "permissions", "isActive"]
    });
    if (!admin || !admin.isActive) {
      return res.error(401, "ADMIN_ACCOUNT_INACTIVE");
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: Array.isArray(admin.permissions) ? admin.permissions : []
    };
    return next();
  } catch (error) {
    return res.error(401, "ADMIN_UNAUTHORIZED");
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.admin) return res.error(401, "ADMIN_UNAUTHORIZED");
    if (!roles.includes(req.admin.role)) return res.error(403, "ADMIN_FORBIDDEN");
    return next();
  };
}

module.exports = {
  authenticateAdmin,
  authorizeRoles,
  signAdminToken
};
