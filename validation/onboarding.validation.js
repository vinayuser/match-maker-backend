const Joi = require("joi");

const saveStep = Joi.object({
  stepKey: Joi.string()
    .valid(
      "basicInfo",
      "religiousLifestyle",
      "personality",
      "familyBackground",
      "status",
      "matchPreferences",
      "photosReview",
      "account"
    )
    .optional(),
  // Allow any additional onboarding fields (merged into profile)
  firstName: Joi.string().allow("", null),
  lastName: Joi.string().allow("", null),
  dateOfBirth: Joi.string().allow("", null),
  location: Joi.string().allow("", null),
  photos: Joi.array().items(Joi.string().allow("")).max(12)
}).unknown(true);

module.exports = { saveStep };
