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
  reviewUserProfile,
  updateManagedUserProfile,
  setManagedUserLock
};
