const { UserProfile, UserPhoto, sequelize } = require("../models");
const { mapProfilePatch, mapSqlPatchToSequelize } = require("./profileFieldMap");

async function ensureProfileRow(userId) {
  await UserProfile.findOrCreate({
    where: { userId },
    defaults: { userId }
  });
}

function profilePlainToFrontend(p) {
  if (!p || p.userId == null) return {};
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth,
    phone: p.phone,
    city: p.city,
    country: p.country,
    location: p.currentLocation,
    religiousLevel: p.religiousLevel,
    shabbatObservance: p.shabbatObservance,
    kashrutLevel: p.kashrutLevel,
    lifestyleDescription: p.lifestyleDescription,
    personalityTraits: p.personalityTraits,
    hobbies: p.hobbies,
    aboutMe: p.aboutMe,
    lookingFor: p.lookingForRelationship,
    siblingsCount: p.siblingsCount,
    birthOrder: p.birthOrder,
    familyStyle: p.familyStyle,
    motherHeritage: p.motherHeritage,
    fatherHeritage: p.fatherHeritage,
    familyNarrative: p.familyNarrative,
    siblingNotes: p.siblingNotes,
    relationshipStatus: p.maritalStatus,
    hasChildren: p.hasChildren === null ? null : Boolean(p.hasChildren),
    childrenCount: p.childrenCount,
    custodyArrangement: p.childrenLiveWith,
    preferredAgeMin: p.preferredAgeMin,
    preferredAgeMax: p.preferredAgeMax,
    matchReligiousPreference: p.matchReligiousPreference,
    dealBreakerSmoker: p.dealBreakerSmoker === null ? null : Boolean(p.dealBreakerSmoker),
    dealBreakerDifferentReligiousLevel:
      p.dealBreakerDifferentReligiousLevel === null ? null : Boolean(p.dealBreakerDifferentReligiousLevel),
    dealBreakerHasChildren:
      p.dealBreakerHasChildren === null ? null : Boolean(p.dealBreakerHasChildren),
    agreementAccepted: p.agreementAccepted === null ? null : Boolean(p.agreementAccepted),
    profileStatus: p.profileStatus,
    isLocked: Boolean(p.isLocked),
    verificationStatus: p.verificationStatus,
    lastOnboardingStep: p.lastOnboardingStep,
    isCohen: p.isCohen === null ? null : Boolean(p.isCohen),
    lineageNotes: p.lineageNotes,
    accountEmail: undefined,
    accountPassword: undefined
  };
}

async function getProfileBundle(userId) {
  const profileRow = await UserProfile.findByPk(userId);
  const p = profileRow ? profileRow.get({ plain: true }) : {};
  const photoRows = await UserPhoto.findAll({
    where: { userId },
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"]
    ]
  });
  return {
    profile: profilePlainToFrontend(p),
    photos: photoRows.map((ph) => {
      const row = ph.get({ plain: true });
      return {
        id: row.id,
        image_url: row.imageUrl,
        sort_order: row.sortOrder,
        is_primary: row.isPrimary,
        moderation_status: row.moderationStatus
      };
    })
  };
}

async function mergeProfile(userId, body, stepKey) {
  await ensureProfileRow(userId);
  const patch = mapProfilePatch(body);
  if (stepKey) {
    patch.last_onboarding_step = stepKey;
  }

  const keys = Object.keys(patch);
  if (keys.length === 0) {
    if (stepKey) {
      await UserProfile.update({ lastOnboardingStep: stepKey }, { where: { userId } });
    }
    return getProfileBundle(userId);
  }

  const sequelizePatch = mapSqlPatchToSequelize(patch);
  await UserProfile.update(sequelizePatch, { where: { userId } });
  return getProfileBundle(userId);
}

async function replacePhotos(userId, urls) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  const t = await sequelize.transaction();
  try {
    await UserPhoto.destroy({ where: { userId }, transaction: t });
    for (let i = 0; i < list.length; i += 1) {
      await UserPhoto.create(
        {
          userId,
          imageUrl: list[i],
          sortOrder: i,
          isPrimary: i === 0 ? 1 : 0,
          moderationStatus: "pending"
        },
        { transaction: t }
      );
    }
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
  return getProfileBundle(userId);
}

const REQUIRED_FOR_SUBMIT = [
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
  "currentLocation",
  "religiousLevel",
  "shabbatObservance",
  "kashrutLevel",
  "lifestyleDescription",
  "aboutMe",
  "lookingForRelationship",
  "maritalStatus",
  "preferredAgeMin",
  "preferredAgeMax"
];

async function submitOnboarding(userId) {
  const row = await UserProfile.findByPk(userId);
  if (!row) {
    const err = new Error("PROFILE_NOT_FOUND");
    err.code = "VALIDATION";
    throw err;
  }
  const profile = row.get({ plain: true });

  const missing = REQUIRED_FOR_SUBMIT.filter((attr) => profile[attr] === null || profile[attr] === "");
  if (missing.length) {
    const err = new Error(`INCOMPLETE_PROFILE:${missing.join(",")}`);
    err.code = "VALIDATION";
    err.missing = missing;
    throw err;
  }

  const count = await UserPhoto.count({ where: { userId } });
  if (count < 1) {
    const err = new Error("PRIMARY_PHOTO_REQUIRED");
    err.code = "VALIDATION";
    throw err;
  }

  if (!profile.agreementAccepted) {
    const err = new Error("AGREEMENT_REQUIRED");
    err.code = "VALIDATION";
    throw err;
  }

  await UserProfile.update(
    {
      profileStatus: "pending_review",
      verificationStatus: "pending",
      onboardingCompletedAt: new Date(),
      lastOnboardingStep: "submitted"
    },
    { where: { userId } }
  );

  return getProfileBundle(userId);
}

module.exports = {
  getProfileBundle,
  mergeProfile,
  replacePhotos,
  submitOnboarding
};
