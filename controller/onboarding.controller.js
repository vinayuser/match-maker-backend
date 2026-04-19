const OnboardingService = require("../services/onboarding.service");
const { saveStep: saveStepSchema } = require("../validation/onboarding.validation");

module.exports.getOnboarding = async (req, res, next) => {
  try {
    const bundle = await OnboardingService.getProfileBundle(req.user.id);
    return res.success("OK", bundle);
  } catch (e) {
    next(e);
  }
};

module.exports.patchOnboarding = async (req, res, next) => {
  try {
    const body = await saveStepSchema.validateAsync(req.body);
    const { stepKey, photos, ...rest } = body;

    if (Array.isArray(photos)) {
      await OnboardingService.replacePhotos(req.user.id, photos);
    }

    const data = { ...rest };
    const bundle = await OnboardingService.mergeProfile(req.user.id, data, stepKey || null);
    return res.success("SAVED", bundle);
  } catch (e) {
    next(e);
  }
};

module.exports.submitOnboarding = async (req, res, next) => {
  try {
    const bundle = await OnboardingService.submitOnboarding(req.user.id);
    return res.success("SUBMITTED_PENDING_REVIEW", bundle);
  } catch (e) {
    if (e.code === "VALIDATION") {
      return res.error(400, e.message, { missing: e.missing });
    }
    next(e);
  }
};
