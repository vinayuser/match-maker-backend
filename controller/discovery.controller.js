const DiscoveryService = require("../services/discovery.service");

module.exports.cards = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 25);
    const minMatchPercent = Number(req.query.minMatchPercent || 65);
    const preferredGender = String(req.query.preferredGender || "");
    const cards = await DiscoveryService.getDiscoveryCards(req.user.id, {
      limit,
      minMatchPercent,
      preferredGender,
      religiousLevel: String(req.query.religiousLevel || ""),
      lifestyle: String(req.query.lifestyle || ""),
      location: String(req.query.location || ""),
      minAge: Number(req.query.minAge || 0),
      maxAge: Number(req.query.maxAge || 0)
    });
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

module.exports.markNotInterested = async (req, res, next) => {
  try {
    const toUserId = Number(req.params.targetUserId);
    if (!Number.isFinite(toUserId) || toUserId <= 0) {
      return res.error(400, "INVALID_TARGET_USER_ID");
    }
    const result = await DiscoveryService.markNotInterested(req.user.id, toUserId);
    return res.success("NOT_INTERESTED_MARKED", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    if (error.code === "CONFLICT") return res.error(409, error.message);
    if (error.code === "VALIDATION") return res.error(400, error.message);
    return next(error);
  }
};

module.exports.sentRequests = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await DiscoveryService.listSentRequests(req.user.id, { page, limit });
    return res.success("OK", result);
  } catch (error) {
    return next(error);
  }
};

module.exports.favorites = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await DiscoveryService.listFavorites(req.user.id, { page, limit });
    return res.success("OK", result);
  } catch (error) {
    return next(error);
  }
};

module.exports.favorite = async (req, res, next) => {
  try {
    const toUserId = Number(req.params.targetUserId);
    if (!Number.isFinite(toUserId) || toUserId <= 0) {
      return res.error(400, "INVALID_TARGET_USER_ID");
    }
    const result = await DiscoveryService.toggleFavorite(req.user.id, toUserId, { favorite: true });
    return res.success("FAVORITE_MARKED", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    if (error.code === "CONFLICT") return res.error(409, error.message);
    if (error.code === "VALIDATION") return res.error(400, error.message);
    return next(error);
  }
};

module.exports.unfavorite = async (req, res, next) => {
  try {
    const toUserId = Number(req.params.targetUserId);
    if (!Number.isFinite(toUserId) || toUserId <= 0) {
      return res.error(400, "INVALID_TARGET_USER_ID");
    }
    const result = await DiscoveryService.toggleFavorite(req.user.id, toUserId, { favorite: false });
    return res.success("FAVORITE_REMOVED", result);
  } catch (error) {
    if (error.code === "NOT_FOUND") return res.error(404, error.message);
    if (error.code === "CONFLICT") return res.error(409, error.message);
    if (error.code === "VALIDATION") return res.error(400, error.message);
    return next(error);
  }
};
