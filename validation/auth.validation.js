const Joi = require("joi");

const register = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required()
});

const login = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

module.exports = { register, login };
