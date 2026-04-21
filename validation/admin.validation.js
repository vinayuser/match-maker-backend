const Joi = require("joi");

const permissionItem = Joi.string().trim().min(2).max(64);

const bootstrapSuperAdmin = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().trim().min(2).max(120).required()
});

const adminLogin = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

const createMatchmakerAdmin = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  role: Joi.string().valid("matchmaker_admin").default("matchmaker_admin"),
  permissions: Joi.array().items(permissionItem).max(100).default([])
});

const updateMatchmakerAdmin = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  permissions: Joi.array().items(permissionItem).max(100),
  isActive: Joi.boolean(),
  password: Joi.string().min(8).max(128),
  role: Joi.string().valid("matchmaker_admin")
}).min(1);

const createMatchmakerTeamMember = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required(),
  avatarUrl: Joi.string().trim().uri().max(1024).allow("", null),
  roleIds: Joi.array().items(Joi.number().integer().positive()).default([]),
  permissions: Joi.array().items(permissionItem).max(100).default([])
});

const updateMatchmakerTeamMember = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  email: Joi.string().trim().email(),
  password: Joi.string().min(8).max(128),
  avatarUrl: Joi.string().trim().uri().max(1024).allow("", null),
  roleIds: Joi.array().items(Joi.number().integer().positive()),
  permissions: Joi.array().items(permissionItem).max(100)
}).min(1);

const lockMatchmakerTeamMember = Joi.object({
  isLocked: Joi.boolean().required()
});

const createAdminRole = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  slug: Joi.string().trim().max(80).allow("", null),
  description: Joi.string().trim().max(255).allow("", null),
  isActive: Joi.boolean().default(true),
  permissionKeys: Joi.array().items(permissionItem).default([])
});

const updateAdminRole = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  slug: Joi.string().trim().max(80),
  description: Joi.string().trim().max(255).allow("", null),
  isActive: Joi.boolean(),
  permissionKeys: Joi.array().items(permissionItem)
}).min(1);

const reviewUserProfile = Joi.object({
  decision: Joi.string().valid("approve", "reject").required(),
  note: Joi.string().trim().max(2000).allow("", null)
});

const updateManagedUserProfile = Joi.object({
  firstName: Joi.string().trim().max(120),
  lastName: Joi.string().trim().max(120),
  phone: Joi.string().trim().max(64).allow(""),
  city: Joi.string().trim().max(120).allow(""),
  country: Joi.string().trim().max(120).allow(""),
  religiousLevel: Joi.string().trim().max(64).allow(""),
  profileStatus: Joi.string().valid("draft", "pending_review", "active", "paused", "in_match", "closed")
}).min(1);

const setManagedUserLock = Joi.object({
  isLocked: Joi.boolean().required()
});

module.exports = {
  bootstrapSuperAdmin,
  adminLogin,
  createMatchmakerAdmin,
  updateMatchmakerAdmin,
  createMatchmakerTeamMember,
  updateMatchmakerTeamMember,
  lockMatchmakerTeamMember,
  createAdminRole,
  updateAdminRole,
  reviewUserProfile,
  updateManagedUserProfile,
  setManagedUserLock
};
