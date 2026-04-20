const bcrypt = require("bcryptjs");
const { AdminUser } = require("../models");
const { signAdminToken } = require("../common/authenticateAdmin");

function sanitizeAdmin(admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
    isActive: admin.isActive
  };
}

async function countSuperAdmins() {
  return AdminUser.count({ where: { role: "super_admin" } });
}

async function findAdminByEmail(email) {
  return AdminUser.findOne({
    where: { email: email.toLowerCase().trim() }
  });
}

async function bootstrapSuperAdmin({ email, password, name }) {
  const existingSuperAdmins = await countSuperAdmins();
  if (existingSuperAdmins > 0) {
    const error = new Error("SUPER_ADMIN_ALREADY_EXISTS");
    error.code = "ADMIN_BOOTSTRAP_BLOCKED";
    throw error;
  }

  const existingEmail = await findAdminByEmail(email);
  if (existingEmail) {
    const error = new Error("ADMIN_EMAIL_ALREADY_REGISTERED");
    error.code = "ADMIN_EXISTS";
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await AdminUser.create({
    email: email.toLowerCase().trim(),
    name: name.trim(),
    role: "super_admin",
    passwordHash,
    permissions: ["admin:create", "admin:update", "admin:list", "admin:assign_permissions"],
    isActive: true
  });

  const token = signAdminToken({
    tokenType: "admin",
    sub: admin.id,
    adminId: admin.id,
    role: admin.role,
    email: admin.email
  });

  return { token, admin: sanitizeAdmin(admin) };
}

async function loginAdmin(email, password) {
  const admin = await findAdminByEmail(email);
  if (!admin) {
    const error = new Error("INVALID_ADMIN_CREDENTIALS");
    error.code = "ADMIN_AUTH";
    throw error;
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    const error = new Error("INVALID_ADMIN_CREDENTIALS");
    error.code = "ADMIN_AUTH";
    throw error;
  }

  if (!admin.isActive) {
    const error = new Error("ADMIN_ACCOUNT_INACTIVE");
    error.code = "ADMIN_AUTH";
    throw error;
  }

  await admin.update({ lastLoginAt: new Date() });

  const token = signAdminToken({
    tokenType: "admin",
    sub: admin.id,
    adminId: admin.id,
    role: admin.role,
    email: admin.email
  });

  return { token, admin: sanitizeAdmin(admin) };
}

module.exports = {
  bootstrapSuperAdmin,
  loginAdmin
};
