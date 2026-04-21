const { Op, QueryTypes } = require("sequelize");
const { sequelize, UserProfile, InterestInvitation } = require("../models");
const { canSuggestCandidateForViewer } = require("./matchingRules.service");

function toLower(value) {
  return String(value || "").toLowerCase().trim();
}

function includesText(haystack, needle) {
  if (!haystack || !needle) return false;
  return toLower(haystack).includes(toLower(needle));
}

function normalizePercent(value, fallback = 65) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(100, Math.round(n)));
}

function normalizeGender(value) {
  const v = toLower(value);
  if (v === "male" || v === "female") return v;
  return "";
}

function getDefaultLookingForGender(gender) {
  const normalized = normalizeGender(gender);
  if (normalized === "male") return "female";
  if (normalized === "female") return "male";
  return "";
}

function scorePreferenceMatch(viewer, candidate) {
  const breakdown = [];
  let score = 0;
  let totalWeight = 0;

  const addWeightedCheck = (label, weight, matched) => {
    if (!weight || weight <= 0) return;
    totalWeight += weight;
    if (matched) score += weight;
    breakdown.push({ label, matched: Boolean(matched), weight });
  };

  const minAge = Number(viewer.preferredAgeMin || 0);
  const maxAge = Number(viewer.preferredAgeMax || 0);
  const candidateAge = Number(candidate.age || 0);
  const hasAgePreference = minAge > 0 || maxAge > 0;
  const ageMatched =
    !hasAgePreference ||
    (candidateAge > 0 && (minAge === 0 || candidateAge >= minAge) && (maxAge === 0 || candidateAge <= maxAge));
  addWeightedCheck("Age range", 20, ageMatched);

  const religiousMatched =
    !viewer.preferredReligiousLevel || includesText(candidate.religiousLevel, viewer.preferredReligiousLevel);
  addWeightedCheck("Religious preference", 25, religiousMatched);

  const lifestyleMatched = !viewer.preferredLifestyle || includesText(candidate.shabbatObservance, viewer.preferredLifestyle);
  addWeightedCheck("Lifestyle fit", 20, lifestyleMatched);

  const candidateLocation = `${candidate.city || ""} ${candidate.country || ""}`.trim();
  const locationMatched = !viewer.preferredLocation || includesText(candidateLocation, viewer.preferredLocation);
  addWeightedCheck("Preferred location", 20, locationMatched);

  const backgroundMatched =
    !viewer.preferredBackground ||
    includesText(candidate.educationLevel, viewer.preferredBackground) ||
    includesText(candidate.occupation, viewer.preferredBackground);
  addWeightedCheck("Background alignment", 15, backgroundMatched);

  const compatibilityPercent = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
  return {
    score,
    totalWeight,
    compatibilityPercent,
    breakdown
  };
}

function getMatchedPreferences(viewer, candidate) {
  const tags = [];
  const minAge = Number(viewer.preferredAgeMin || 0);
  const maxAge = Number(viewer.preferredAgeMax || 0);
  const hasAgePreference = minAge > 0 || maxAge > 0;
  const age = Number(candidate.age || 0);

  if (viewer.preferredReligiousLevel && candidate.religiousLevel) {
    if (toLower(candidate.religiousLevel).includes(toLower(viewer.preferredReligiousLevel))) {
      tags.push("Religious preference");
    }
  }
  if (viewer.preferredLocation && (candidate.city || candidate.country)) {
    const location = `${candidate.city || ""} ${candidate.country || ""}`;
    if (toLower(location).includes(toLower(viewer.preferredLocation))) {
      tags.push("Preferred location");
    }
  }
  if (!hasAgePreference || (age > 0 && (minAge === 0 || age >= minAge) && (maxAge === 0 || age <= maxAge))) {
    tags.push("Age range");
  }
  if (viewer.preferredLifestyle && candidate.shabbatObservance) {
    if (toLower(candidate.shabbatObservance).includes(toLower(viewer.preferredLifestyle))) {
      tags.push("Lifestyle fit");
    }
  }
  return tags;
}

async function getDiscoveryCards(viewerUserId, { limit = 25, minMatchPercent = 65, preferredGender = "" } = {}) {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 25;
  const safeMinMatchPercent = normalizePercent(minMatchPercent, 65);
  const viewer = await UserProfile.findByPk(viewerUserId, {
    attributes: [
      "userId",
      "gender",
      "isCohen",
      "lookingForGender",
      "preferredAgeMin",
      "preferredAgeMax",
      "preferredLocation",
      "preferredReligiousLevel",
      "preferredLifestyle",
      "preferredBackground"
    ]
  });

  if (!viewer) return [];

  const viewerGender = normalizeGender(viewer.gender);
  const profileLookingForGender = normalizeGender(viewer.lookingForGender);
  const requestedGender = normalizeGender(preferredGender);
  const resolvedLookingForGender = requestedGender || profileLookingForGender || getDefaultLookingForGender(viewerGender);
  const minAge = Number(viewer.preferredAgeMin || 0);
  const maxAge = Number(viewer.preferredAgeMax || 0);

  const fetchLimit = Math.min(Math.max(safeLimit * 5, 100), 500);
  const rows = await sequelize.query(
    `
    SELECT
      up.user_id AS userId,
      up.first_name AS firstName,
      up.last_name AS lastName,
      up.gender AS gender,
      up.city AS city,
      up.country AS country,
      up.religious_level AS religiousLevel,
      up.occupation AS occupation,
      up.education_level AS educationLevel,
      up.about_me AS aboutMe,
      up.date_of_birth AS dateOfBirth,
      up.shabbat_observance AS shabbatObservance,
      up.marital_status AS maritalStatus,
      TIMESTAMPDIFF(YEAR, up.date_of_birth, CURDATE()) AS age,
      (
        SELECT p.image_url
        FROM user_photos p
        WHERE p.user_id = up.user_id
        ORDER BY p.is_primary DESC, p.sort_order ASC, p.id ASC
        LIMIT 1
      ) AS avatarUrl
    FROM user_profiles up
    WHERE up.user_id <> :viewerUserId
      AND up.profile_status = 'active'
      AND up.verification_status = 'verified'
      AND up.is_locked = 0
      AND (:resolvedLookingForGender = '' OR up.gender = :resolvedLookingForGender)
      AND (
        :viewerGender = ''
        OR up.looking_for_gender IS NULL
        OR up.looking_for_gender = ''
        OR up.looking_for_gender = :viewerGender
      )
      AND (:minAge = 0 OR TIMESTAMPDIFF(YEAR, up.date_of_birth, CURDATE()) >= :minAge)
      AND (:maxAge = 0 OR TIMESTAMPDIFF(YEAR, up.date_of_birth, CURDATE()) <= :maxAge)
      AND NOT EXISTS (
        SELECT 1
        FROM interest_invitations inv
        WHERE (
          (inv.from_user_id = :viewerUserId AND inv.to_user_id = up.user_id)
          OR (inv.from_user_id = up.user_id AND inv.to_user_id = :viewerUserId)
        )
          AND inv.status IN ('pending', 'accepted')
      )
    ORDER BY up.updated_at DESC
    LIMIT :fetchLimit
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        viewerUserId,
        resolvedLookingForGender,
        viewerGender,
        minAge,
        maxAge,
        fetchLimit
      }
    }
  );

  const cards = [];
  for (const row of rows) {
    const halachic = canSuggestCandidateForViewer(
      { gender: viewer.gender, is_cohen: viewer.isCohen, marital_status: null },
      { gender: row.gender, marital_status: row.maritalStatus }
    );
    if (!halachic.allowed) continue;
    const compatibility = scorePreferenceMatch(viewer, row);
    if (compatibility.compatibilityPercent < safeMinMatchPercent) continue;

    const fullName = `${row.firstName || ""} ${row.lastName || ""}`.trim() || "Profile";
    cards.push({
      userId: Number(row.userId),
      fullName,
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      age: row.age || null,
      city: row.city || "",
      country: row.country || "",
      religiousLevel: row.religiousLevel || "",
      occupation: row.occupation || "",
      educationLevel: row.educationLevel || "",
      aboutMe: row.aboutMe || "",
      avatarUrl: row.avatarUrl || "",
      matchPercent: compatibility.compatibilityPercent,
      matchedPreferences: getMatchedPreferences(viewer, row),
      matchBreakdown: compatibility.breakdown
    });
    if (cards.length >= safeLimit) break;
  }

  cards.sort((a, b) => b.matchPercent - a.matchPercent);
  return cards;
}

async function sendInterest(fromUserId, toUserId) {
  if (fromUserId === toUserId) {
    const error = new Error("SELF_INTEREST_NOT_ALLOWED");
    error.code = "VALIDATION";
    throw error;
  }

  const target = await UserProfile.findOne({
    where: {
      userId: toUserId,
      profileStatus: "active",
      verificationStatus: "verified",
      isLocked: { [Op.ne]: 1 }
    },
    attributes: ["userId"]
  });
  if (!target) {
    const error = new Error("TARGET_PROFILE_NOT_AVAILABLE");
    error.code = "NOT_FOUND";
    throw error;
  }

  const existing = await InterestInvitation.findOne({
    where: { fromUserId, toUserId }
  });
  if (existing) {
    if (existing.status === "pending" || existing.status === "accepted") {
      const error = new Error("INTEREST_ALREADY_SENT");
      error.code = "CONFLICT";
      throw error;
    }
    await existing.update({ status: "pending" });
    return { id: existing.id, fromUserId, toUserId, status: "pending" };
  }

  const created = await InterestInvitation.create({
    fromUserId,
    toUserId,
    status: "pending"
  });
  return { id: created.id, fromUserId, toUserId, status: created.status };
}

module.exports = {
  getDiscoveryCards,
  sendInterest
};
