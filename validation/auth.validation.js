const Joi = require("joi");

const emailSchema = Joi.string().trim().email({ tlds: { allow: false } });

const register = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().min(8).max(128).required()
});

const login = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().required()
});

module.exports = { register, login };
