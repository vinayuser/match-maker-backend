const DiscoveryService = require("../services/discovery.service");

module.exports.cards = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 25);
    const minMatchPercent = Number(req.query.minMatchPercent || 65);
    const preferredGender = String(req.query.preferredGender || "");
    const cards = await DiscoveryService.getDiscoveryCards(req.user.id, { limit, minMatchPercent, preferredGender });
    return res.success("OK", { cards });
  } catch (error) {
    return next(error);
  }
};

module.exports.sendInterest = async (req, res, next) => {
  try {
    const toUserId = Number(req.params.targetUserId);
    if (!Number.isFinite(toUserId) || toUserId <= 0) {
      return res.error(400, "INVALID_TARGET_USER_ID");
    }
    const result = await DiscoveryService.sendInterest(req.user.id, toUserId);
    return res.success("INTEREST_SENT", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    if (error.code === "CONFLICT") return res.error(409, error.message);
    if (error.code === "VALIDATION") return res.error(400, error.message);
    return next(error);
  }
};
