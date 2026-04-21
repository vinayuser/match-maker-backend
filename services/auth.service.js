const bcrypt = require("bcryptjs");
const { User, UserProfile, UserPhoto, sequelize } = require("../models");
const { signToken } = require("../common/authenticate");

async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  const t = await sequelize.transaction();
  try {
    const user = await User.create(
      {
        email: email.toLowerCase().trim(),
        passwordHash
      },
      { transaction: t }
    );
    await UserProfile.create({ userId: user.id }, { transaction: t });
    await t.commit();
    return { id: user.id, email: user.email };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

async function findByEmail(email) {
  return User.findOne({
    where: { email: email.toLowerCase().trim() },
    raw: true
  });
}

async function login(email, password) {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
    include: [
      {
        model: UserProfile,
        as: "profile",
        attributes: ["profileStatus", "verificationStatus"]
      }
    ]
  });
  if (!user) {
    const err = new Error("INVALID_CREDENTIALS");
    err.code = "AUTH";
    throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("INVALID_CREDENTIALS");
    err.code = "AUTH";
    throw err;
  }
  const profileStatus = user.profile?.profileStatus || "draft";
  const verificationStatus = user.profile?.verificationStatus || "unverified";
  if (verificationStatus === "rejected") {
    const err = new Error("ACCOUNT_REJECTED_BY_ADMIN");
    err.code = "AUTH_VERIFICATION";
    err.profileStatus = profileStatus;
    err.verificationStatus = verificationStatus;
    throw err;
  }
  if (profileStatus === "pending_review" && verificationStatus !== "verified") {
    const err = new Error("ACCOUNT_PENDING_ADMIN_VERIFICATION");
    err.code = "AUTH_VERIFICATION";
    err.profileStatus = profileStatus;
    err.verificationStatus = verificationStatus;
    throw err;
  }
  const token = signToken({ sub: user.id, userId: user.id, email: user.email });
  const avatar = await UserPhoto.findOne({
    where: { userId: user.id },
    attributes: ["imageUrl"],
    order: [
      ["isPrimary", "DESC"],
      ["sortOrder", "ASC"],
      ["id", "ASC"]
    ]
  });
  const firstName = user.profile?.firstName || "";
  const lastName = user.profile?.lastName || "";
  const displayName = `${firstName} ${lastName}`.trim() || user.email.split("@")[0];
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      displayName,
      avatarUrl: avatar?.imageUrl || "",
      profileStatus,
      verificationStatus
    }
  };
}

async function getUserMe(userId) {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: UserProfile,
        as: "profile",
        attributes: ["firstName", "lastName", "profileStatus", "verificationStatus"]
      }
    ]
  });
  if (!user) return null;
  const avatar = await UserPhoto.findOne({
    where: { userId: user.id },
    attributes: ["imageUrl"],
    order: [
      ["isPrimary", "DESC"],
      ["sortOrder", "ASC"],
      ["id", "ASC"]
    ]
  });
  const firstName = user.profile?.firstName || "";
  const lastName = user.profile?.lastName || "";
  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`.trim() || user.email.split("@")[0],
    avatarUrl: avatar?.imageUrl || "",
    profileStatus: user.profile?.profileStatus || "draft",
    verificationStatus: user.profile?.verificationStatus || "unverified"
  };
}

module.exports = {
  createUser,
  findByEmail,
  login,
  getUserMe
};
