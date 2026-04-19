const { DataTypes, Model } = require("sequelize");
const sequelize = require("./sequelize");

class UserProfile extends Model {}

UserProfile.init(
  {
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      field: "user_id"
    },
    firstName: { type: DataTypes.STRING(120), field: "first_name" },
    lastName: { type: DataTypes.STRING(120), field: "last_name" },
    gender: DataTypes.ENUM("male", "female", "other"),
    dateOfBirth: { type: DataTypes.DATEONLY, field: "date_of_birth" },
    phone: DataTypes.STRING(64),
    emailVisible: { type: DataTypes.TINYINT(1), defaultValue: 0, field: "email_visible" },
    phoneVisible: { type: DataTypes.TINYINT(1), defaultValue: 0, field: "phone_visible" },
    city: DataTypes.STRING(120),
    country: DataTypes.STRING(120),
    currentLocation: { type: DataTypes.STRING(255), field: "current_location" },
    nativeLanguage: { type: DataTypes.STRING(64), field: "native_language" },
    additionalLanguages: { type: DataTypes.JSON, field: "additional_languages" },
    educationLevel: { type: DataTypes.STRING(120), field: "education_level" },
    fieldOfStudy: { type: DataTypes.STRING(255), field: "field_of_study" },
    occupation: DataTypes.STRING(255),
    workDetails: { type: DataTypes.TEXT, field: "work_details" },
    religiousLevel: { type: DataTypes.STRING(64), field: "religious_level" },
    shabbatObservance: { type: DataTypes.STRING(64), field: "shabbat_observance" },
    kashrutLevel: { type: DataTypes.STRING(64), field: "kashrut_level" },
    prayerSynagogue: { type: DataTypes.STRING(255), field: "prayer_synagogue" },
    dressStyle: { type: DataTypes.STRING(255), field: "dress_style" },
    lifestyleDescription: { type: DataTypes.TEXT, field: "lifestyle_description" },
    aboutMe: { type: DataTypes.TEXT, field: "about_me" },
    personalityTraits: { type: DataTypes.JSON, field: "personality_traits" },
    hobbies: { type: DataTypes.JSON },
    lifeGoals: { type: DataTypes.TEXT, field: "life_goals" },
    importantValues: { type: DataTypes.TEXT, field: "important_values" },
    lookingForRelationship: { type: DataTypes.TEXT, field: "looking_for_relationship" },
    familyDescription: { type: DataTypes.TEXT, field: "family_description" },
    parentsBackground: { type: DataTypes.TEXT, field: "parents_background" },
    siblingsCount: { type: DataTypes.INTEGER.UNSIGNED, field: "siblings_count" },
    birthOrder: { type: DataTypes.STRING(64), field: "birth_order" },
    familyReligiousStyle: { type: DataTypes.STRING(128), field: "family_religious_style" },
    familyStyle: { type: DataTypes.STRING(128), field: "family_style" },
    motherHeritage: { type: DataTypes.STRING(255), field: "mother_heritage" },
    fatherHeritage: { type: DataTypes.STRING(255), field: "father_heritage" },
    familyNarrative: { type: DataTypes.TEXT, field: "family_narrative" },
    siblingNotes: { type: DataTypes.TEXT, field: "sibling_notes" },
    heightCm: { type: DataTypes.SMALLINT.UNSIGNED, field: "height_cm" },
    smoking: DataTypes.ENUM("no", "sometimes", "yes"),
    alcohol: DataTypes.ENUM("no", "sometimes", "yes"),
    drivingLicense: { type: DataTypes.ENUM("yes", "no", "unknown"), field: "driving_license" },
    willingRelocate: { type: DataTypes.ENUM("yes", "no", "maybe"), field: "willing_relocate" },
    maritalStatus: { type: DataTypes.ENUM("single", "divorced", "widowed"), field: "marital_status" },
    hasChildren: { type: DataTypes.TINYINT(1), field: "has_children" },
    childrenCount: { type: DataTypes.SMALLINT.UNSIGNED, field: "children_count" },
    childrenLiveWith: { type: DataTypes.ENUM("yes", "no", "partially"), field: "children_live_with" },
    wantMoreChildren: { type: DataTypes.ENUM("yes", "no", "not_sure"), field: "want_more_children" },
    isCohen: { type: DataTypes.TINYINT(1), field: "is_cohen" },
    lineageNotes: { type: DataTypes.STRING(255), field: "lineage_notes" },
    lookingForGender: { type: DataTypes.ENUM("male", "female"), field: "looking_for_gender" },
    preferredAgeMin: { type: DataTypes.SMALLINT.UNSIGNED, field: "preferred_age_min" },
    preferredAgeMax: { type: DataTypes.SMALLINT.UNSIGNED, field: "preferred_age_max" },
    preferredLocation: { type: DataTypes.TEXT, field: "preferred_location" },
    preferredReligiousLevel: { type: DataTypes.STRING(128), field: "preferred_religious_level" },
    preferredLifestyle: { type: DataTypes.STRING(255), field: "preferred_lifestyle" },
    preferredBackground: { type: DataTypes.TEXT, field: "preferred_background" },
    importantValuesMatch: { type: DataTypes.TEXT, field: "important_values_match" },
    dealBreakers: { type: DataTypes.TEXT, field: "deal_breakers" },
    preferredPersonalityTraits: { type: DataTypes.TEXT, field: "preferred_personality_traits" },
    relationshipGoal: { type: DataTypes.STRING(128), field: "relationship_goal" },
    marriageTimeline: { type: DataTypes.STRING(255), field: "marriage_timeline" },
    openToMatchmaker: { type: DataTypes.TINYINT(1), field: "open_to_matchmaker" },
    matchReligiousPreference: { type: DataTypes.STRING(128), field: "match_religious_preference" },
    dealBreakerSmoker: { type: DataTypes.TINYINT(1), field: "deal_breaker_smoker" },
    dealBreakerDifferentReligiousLevel: {
      type: DataTypes.TINYINT(1),
      field: "deal_breaker_different_religious_level"
    },
    dealBreakerHasChildren: { type: DataTypes.TINYINT(1), field: "deal_breaker_has_children" },
    agreementAccepted: { type: DataTypes.TINYINT(1), field: "agreement_accepted" },
    profileStatus: {
      type: DataTypes.ENUM("draft", "pending_review", "active", "paused", "in_match", "closed"),
      defaultValue: "draft",
      field: "profile_status"
    },
    isLocked: { type: DataTypes.TINYINT(1), defaultValue: 0, field: "is_locked" },
    verificationStatus: {
      type: DataTypes.ENUM("unverified", "pending", "verified", "rejected"),
      defaultValue: "unverified",
      field: "verification_status"
    },
    assignedMatchmakerId: { type: DataTypes.BIGINT.UNSIGNED, field: "assigned_matchmaker_id" },
    internalNotes: { type: DataTypes.TEXT, field: "internal_notes" },
    lastOnboardingStep: { type: DataTypes.STRING(64), field: "last_onboarding_step" },
    onboardingCompletedAt: { type: DataTypes.DATE(3), field: "onboarding_completed_at" }
  },
  {
    sequelize,
    modelName: "UserProfile",
    tableName: "user_profiles"
  }
);

module.exports = UserProfile;
