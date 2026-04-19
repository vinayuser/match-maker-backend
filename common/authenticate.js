const jwt = require("jsonwebtoken");
const { User } = require("../models");

function getBearerToken(req) {
  const raw = req.headers.authorization || req.headers.Authorization || "";
  return String(raw)
    .replace(/bearer\s+/i, "")
    .trim();
}

module.exports.authenticateUser = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: "UNAUTHORIZED",
        data: {},
        status: 0,
        isSessionExpired: true
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.error(500, "Server misconfiguration: JWT_SECRET missing");
    }

    const decoded = jwt.verify(token, secret);
    const userId = decoded.sub || decoded.userId;
    if (!userId) {
      return res.status(401).json({
        statusCode: 401,
        message: "INVALID_TOKEN",
        data: {},
        status: 0
      });
    }

    const user = await User.findByPk(userId, { attributes: ["id", "email"] });
    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        message: "USER_NOT_FOUND",
        data: {},
        status: 0
      });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (e) {
    return res.status(401).json({
      statusCode: 401,
      message: "UNAUTHORIZED",
      data: {},
      status: 0,
      isSessionExpired: true
    });
  }
};

module.exports.signToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  const options = { expiresIn: process.env.JWT_EXPIRES_IN || "30d" };
  // jsonwebtoken forbids both payload.sub and options.subject
  if (payload.sub == null && payload.userId != null) {
    options.subject = String(payload.userId);
  }
  return jwt.sign(payload, secret, options);
};
