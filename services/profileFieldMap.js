/**
 * Maps frontend (onboarding session) keys to DB columns on user_profiles.
 */
const BOOL_FIELDS = new Set([
  "hasChildren",
  "dealBreakerSmoker",
  "dealBreakerDifferentReligiousLevel",
  "dealBreakerHasChildren",
  "agreementAccepted",
  "emailVisible",
  "phoneVisible",
  "openToMatchmaker"
]);

const JSON_FIELDS = new Set(["personalityTraits", "hobbies", "additionalLanguages"]);

/** Optional ints: frontend often sends "" for untouched fields — MySQL rejects '' for integer columns. */
const INTEGER_FIELDS = new Set([
  "siblingsCount",
  "childrenCount",
  "preferredAgeMin",
  "preferredAgeMax"
]);

function normalizeOptionalInt(v) {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).trim();
  if (s === "") return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

/** DB column `children_live_with` is ENUM('yes','no','partially'). UI may send those or legacy labels. */
const VALID_CHILDREN_LIVE_WITH = new Set(["yes", "no", "partially"]);
const CUSTODY_LABEL_TO_ENUM = {
  "Full Custody": "yes",
  "Shared Custody": "partially",
  "Visitation Only": "no",
  "Adult Children": "yes",
  "Prefer to discuss": null
};

function mapCustodyArrangementToChildrenLiveWith(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  if (VALID_CHILDREN_LIVE_WITH.has(s)) return s;
  if (Object.prototype.hasOwnProperty.call(CUSTODY_LABEL_TO_ENUM, s)) {
    return CUSTODY_LABEL_TO_ENUM[s];
  }
  return null;
}

const DIRECT_MAP = {
  firstName: "first_name",
  lastName: "last_name",
  gender: "gender",
  dateOfBirth: "date_of_birth",
  location: "current_location",
  religiousLevel: "religious_level",
  shabbatObservance: "shabbat_observance",
  kashrutLevel: "kashrut_level",
  lifestyleDescription: "lifestyle_description",
  personalityTraits: "personality_traits",
  hobbies: "hobbies",
  aboutMe: "about_me",
  lookingFor: "looking_for_relationship",
  siblingsCount: "siblings_count",
  birthOrder: "birth_order",
  familyStyle: "family_style",
  motherHeritage: "mother_heritage",
  fatherHeritage: "father_heritage",
  familyNarrative: "family_narrative",
  siblingNotes: "sibling_notes",
  relationshipStatus: "marital_status",
  hasChildren: "has_children",
  childrenCount: "children_count",
  custodyArrangement: "children_live_with",
  preferredAgeMin: "preferred_age_min",
  preferredAgeMax: "preferred_age_max",
  matchReligiousPreference: "match_religious_preference",
  dealBreakerSmoker: "deal_breaker_smoker",
  dealBreakerDifferentReligiousLevel: "deal_breaker_different_religious_level",
  dealBreakerHasChildren: "deal_breaker_has_children",
  agreementAccepted: "agreement_accepted",
  lineageTag: "lineage_notes",
  openToMatchmaker: "open_to_matchmaker",
  additionalLanguages: "additional_languages"
};

function toSqlBool(v) {
  if (v === true || v === 1 || v === "1") return 1;
  if (v === false || v === 0 || v === "0") return 0;
  return null;
}

/**
 * @param {Record<string, unknown>} data - partial payload from one onboarding step
 * @returns {Record<string, unknown>} snake_case column -> value for user_profiles
 */
function mapProfilePatch(data) {
  const out = {};

  for (const [key, col] of Object.entries(DIRECT_MAP)) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      let v = data[key];
      if (BOOL_FIELDS.has(key)) {
        v = toSqlBool(v);
      }
      if (INTEGER_FIELDS.has(key)) {
        v = normalizeOptionalInt(v);
      }
      if (key === "custodyArrangement") {
        v = mapCustodyArrangementToChildrenLiveWith(v);
      }
      if (JSON_FIELDS.has(key) && v !== null && typeof v !== "string") {
        v = JSON.stringify(v);
      }
      out[col] = v;
    }
  }

  // Cohen: frontend uses lineageTag "Cohen" / "Levi" / etc.
  if (Object.prototype.hasOwnProperty.call(data, "lineageTag")) {
    const tag = String(data.lineageTag || "").toLowerCase();
    out.is_cohen = tag === "cohen" ? 1 : 0;
  }

  // Phone / email from extended signup
  if (Object.prototype.hasOwnProperty.call(data, "phone")) out.phone = data.phone;
  if (Object.prototype.hasOwnProperty.call(data, "city")) out.city = data.city;
  if (Object.prototype.hasOwnProperty.call(data, "country")) out.country = data.country;

  if (Object.prototype.hasOwnProperty.call(data, "wantMoreChildren")) {
    const m = { yes: "yes", no: "no", not_sure: "not_sure", unsure: "not_sure" };
    out.want_more_children = m[String(data.wantMoreChildren)] || data.wantMoreChildren;
  }

  return out;
}

/** Convert snake_case SQL column names (from mapProfilePatch) to Sequelize UserProfile attribute names (camelCase). */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * @param {Record<string, unknown>} patch - keys are SQL column names (snake_case)
 * @returns {Record<string, unknown>} Sequelize attribute object for UserProfile.update
 */
function mapSqlPatchToSequelize(patch) {
  const out = {};
  for (const [sqlCol, val] of Object.entries(patch)) {
    const attr = snakeToCamel(sqlCol);
    let v = val;
    if (attr === "personalityTraits" || attr === "hobbies" || attr === "additionalLanguages") {
      if (typeof v === "string") {
        try {
          v = JSON.parse(v);
        } catch {
          /* keep string */
        }
      }
    }
    out[attr] = v;
  }
  return out;
}

module.exports = {
  mapProfilePatch,
  mapSqlPatchToSequelize,
  mapCustodyArrangementToChildrenLiveWith,
  BOOL_FIELDS,
  JSON_FIELDS,
  INTEGER_FIELDS,
  DIRECT_MAP
};
