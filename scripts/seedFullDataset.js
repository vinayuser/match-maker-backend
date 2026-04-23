const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../config/.env") });

const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { sequelize, User, UserProfile, UserPhoto, AdminUser } = require("../models");

const USER_EMAIL_PREFIX = "seed.full";
const USER_DEFAULT_PASSWORD = "User@12345";
const DEFAULT_USER_COUNT = 300;

const SUPER_ADMIN_EMAIL = "admin@matchmaker.com";
const SUPER_ADMIN_PASSWORD = "Admin@123";
const MATCHMAKER_ADMIN_EMAIL = "team.admin@matchmaker.com";
const MATCHMAKER_ADMIN_PASSWORD = "Admin@123";

const MALE_NAMES = [
  "Aaron", "Avi", "Ben", "David", "Daniel", "Eli", "Gabriel", "Isaac", "Jacob", "Levi", "Michael", "Noam", "Oren",
  "Reuben", "Samuel", "Yosef", "Yonatan", "Moshe", "Nathan", "Shlomo"
];
const FEMALE_NAMES = [
  "Abigail", "Adina", "Chaya", "Deborah", "Esther", "Hannah", "Leah", "Miriam", "Naomi", "Rachel", "Rivka", "Sara",
  "Shira", "Tamar", "Yael", "Dina", "Eliana", "Batya", "Talia", "Liora"
];
const LAST_NAMES = [
  "Adler", "Baruch", "Cohen", "Friedman", "Goldberg", "Halevi", "Katz", "Levin", "Mendel", "Natan", "Rosen",
  "Shapiro", "Stein", "Weiss", "Zamir", "Ben-David", "Mizrahi", "Ashkenazi", "Peretz", "Halpern"
];
const REGIONS = [
  { city: "Jerusalem", country: "Israel" },
  { city: "Tel Aviv", country: "Israel" },
  { city: "Haifa", country: "Israel" },
  { city: "Ashdod", country: "Israel" },
  { city: "Netanya", country: "Israel" },
  { city: "Raanana", country: "Israel" },
  { city: "London", country: "United Kingdom" },
  { city: "Manchester", country: "United Kingdom" },
  { city: "New York", country: "United States" },
  { city: "Los Angeles", country: "United States" },
  { city: "Miami", country: "United States" },
  { city: "Toronto", country: "Canada" },
  { city: "Montreal", country: "Canada" },
  { city: "Paris", country: "France" },
  { city: "Marseille", country: "France" },
  { city: "Berlin", country: "Germany" },
  { city: "Antwerp", country: "Belgium" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Sydney", country: "Australia" },
  { city: "Melbourne", country: "Australia" },
  { city: "Johannesburg", country: "South Africa" },
  { city: "Cape Town", country: "South Africa" },
  { city: "Buenos Aires", country: "Argentina" },
  { city: "Sao Paulo", country: "Brazil" },
  { city: "Mexico City", country: "Mexico" }
];
const RELIGIOUS_LEVELS = [
  "Haredi",
  "Dati Leumi",
  "Dati",
  "Traditional",
  "Strengthening",
  "Modern Orthodox",
  "Orthodox",
  "Conservative",
  "Spiritual"
];
const SHABBAT_LEVELS = ["Shomer Shabbat", "Partial", "Flexible", "observant", "traditional"];
const KASHRUT_LEVELS = ["Strict (Glatt)", "Standard Kosher", "Kosher at Home", "Not Observed"];
const EDUCATION_LEVELS = ["Bachelors", "Masters", "PhD", "Professional", "Yeshiva", "Seminary"];
const OCCUPATIONS = [
  "Software Engineer",
  "Product Manager",
  "Teacher",
  "Doctor",
  "Attorney",
  "Financial Analyst",
  "Architect",
  "Research Scientist",
  "Designer",
  "Entrepreneur",
  "Rabbi",
  "Community Coordinator"
];
const PERSONALITY_TRAITS = ["Compassionate", "Driven", "Patient", "Curious", "Family-oriented", "Optimistic", "Thoughtful"];
const HOBBIES = ["Reading", "Hiking", "Cooking", "Music", "Travel", "Learning", "Volunteering"];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toBirthDate(age) {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = randint(0, 11);
  const day = randint(1, 28);
  return new Date(Date.UTC(year, month, day));
}

function seedProfile(index) {
  const genderType = index % 10 === 0 ? "other" : index % 2 === 0 ? "male" : "female";
  const gender = genderType === "other" ? pick(["male", "female"]) : genderType;
  const firstName = gender === "male" ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  const lastName = pick(LAST_NAMES);
  const age = randint(21, 44);
  const location = pick(REGIONS);
  const religiousLevel = pick(RELIGIOUS_LEVELS);
  const shabbatObservance = pick(SHABBAT_LEVELS);
  const occupation = pick(OCCUPATIONS);
  const educationLevel = pick(EDUCATION_LEVELS);
  const lookingForGender = gender === "male" ? "female" : "male";
  const preferredAgeMin = Math.max(18, age - randint(2, 6));
  const preferredAgeMax = Math.min(60, age + randint(2, 8));
  const maritalStatus = Math.random() < 0.82 ? "single" : Math.random() < 0.6 ? "divorced" : "widowed";
  const hasChildren = maritalStatus === "single" ? 0 : Math.random() < 0.35 ? 1 : 0;
  const childrenCount = hasChildren ? randint(1, 3) : null;
  const childrenLiveWith = hasChildren ? pick(["yes", "no", "partially"]) : null;

  return {
    firstName,
    lastName,
    gender,
    city: location.city,
    country: location.country,
    age,
    religiousLevel,
    shabbatObservance,
    kashrutLevel: pick(KASHRUT_LEVELS),
    occupation,
    educationLevel,
    lookingForGender,
    preferredAgeMin,
    preferredAgeMax,
    preferredLocation: `${location.city}, ${location.country}`,
    preferredReligiousLevel: religiousLevel,
    preferredLifestyle: shabbatObservance,
    preferredBackground: occupation,
    maritalStatus,
    hasChildren,
    childrenCount,
    childrenLiveWith,
    isCohen: gender === "male" && Math.random() < 0.12 ? 1 : 0,
    lifestyleDescription: `${firstName} values growth, consistency, and shared commitment in family life.`,
    aboutMe: `${firstName} ${lastName} is seeking a meaningful relationship rooted in values and long-term intention.`,
    personalityTraits: [pick(PERSONALITY_TRAITS), pick(PERSONALITY_TRAITS)],
    hobbies: [pick(HOBBIES), pick(HOBBIES)]
  };
}

async function upsertAdmin({ email, password, name, role, permissions = [], createdBy = null }, transaction) {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await AdminUser.findOne({ where: { email: normalizedEmail }, transaction });
  if (existing) {
    await existing.update(
      { name, role, passwordHash, permissions, isActive: true, createdBy },
      { transaction }
    );
    return existing;
  }
  return AdminUser.create(
    { email: normalizedEmail, name, role, passwordHash, permissions, isActive: true, createdBy },
    { transaction }
  );
}

async function run() {
  const resetOnly = process.argv.includes("--reset");
  const countArg = process.argv.find((x) => x.startsWith("--count="));
  const requestedCount = countArg ? Number(countArg.split("=")[1]) : DEFAULT_USER_COUNT;
  const safeCount = Number.isFinite(requestedCount) ? Math.max(1, Math.min(2000, Math.floor(requestedCount))) : DEFAULT_USER_COUNT;
  const userPasswordHash = await bcrypt.hash(USER_DEFAULT_PASSWORD, 12);

  const t = await sequelize.transaction();
  try {
    const seededUsers = await User.findAll({
      where: { email: { [Op.like]: `${USER_EMAIL_PREFIX}.%@matchmaker.local` } },
      attributes: ["id"],
      transaction: t
    });
    const seededIds = seededUsers.map((u) => u.id);
    if (seededIds.length) {
      await User.destroy({ where: { id: seededIds }, transaction: t });
    }

    const superAdmin = await upsertAdmin(
      {
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        name: "Super Admin",
        role: "super_admin",
        permissions: ["admin:create", "admin:update", "admin:list", "admin:assign_permissions"]
      },
      t
    );
    await upsertAdmin(
      {
        email: MATCHMAKER_ADMIN_EMAIL,
        password: MATCHMAKER_ADMIN_PASSWORD,
        name: "Team Admin",
        role: "matchmaker_admin",
        createdBy: superAdmin.id
      },
      t
    );

    if (!resetOnly) {
      for (let i = 0; i < safeCount; i += 1) {
        const profile = seedProfile(i);
        const user = await User.create(
          {
            email: `${USER_EMAIL_PREFIX}.${String(i + 1).padStart(4, "0")}@matchmaker.local`,
            passwordHash: userPasswordHash
          },
          { transaction: t }
        );
        await UserProfile.create(
          {
            userId: user.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            gender: profile.gender,
            dateOfBirth: toBirthDate(profile.age),
            city: profile.city,
            country: profile.country,
            currentLocation: `${profile.city}, ${profile.country}`,
            educationLevel: profile.educationLevel,
            occupation: profile.occupation,
            religiousLevel: profile.religiousLevel,
            shabbatObservance: profile.shabbatObservance,
            kashrutLevel: profile.kashrutLevel,
            lifestyleDescription: profile.lifestyleDescription,
            aboutMe: profile.aboutMe,
            personalityTraits: profile.personalityTraits,
            hobbies: profile.hobbies,
            lookingForGender: profile.lookingForGender,
            preferredAgeMin: profile.preferredAgeMin,
            preferredAgeMax: profile.preferredAgeMax,
            preferredLocation: profile.preferredLocation,
            preferredReligiousLevel: profile.preferredReligiousLevel,
            preferredLifestyle: profile.preferredLifestyle,
            preferredBackground: profile.preferredBackground,
            maritalStatus: profile.maritalStatus,
            hasChildren: profile.hasChildren,
            childrenCount: profile.childrenCount,
            childrenLiveWith: profile.childrenLiveWith,
            isCohen: profile.isCohen,
            profileStatus: "active",
            verificationStatus: "verified",
            agreementAccepted: 1,
            lastOnboardingStep: "submitted",
            onboardingCompletedAt: new Date(Date.now() - i * 10 * 60 * 1000),
            internalNotes: "Seeded by seedFullDataset script"
          },
          { transaction: t }
        );
        await UserPhoto.create(
          {
            userId: user.id,
            imageUrl: `https://picsum.photos/seed/kesher-${i + 1}/900/1200`,
            sortOrder: 0,
            isPrimary: 1,
            moderationStatus: "approved"
          },
          { transaction: t }
        );
      }
    }

    await t.commit();

    const totalVerified = await UserProfile.count({
      where: { profileStatus: "active", verificationStatus: "verified" }
    });

    console.log(resetOnly ? "Full dataset reset completed (seeded records removed)." : `Full dataset seeded: ${safeCount} users created.`);
    console.log(`Active + verified profiles in DB: ${totalVerified}`);
    console.log(`Seeded users password: ${USER_DEFAULT_PASSWORD}`);
    console.log(`Super admin: ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`);
    console.log(`Matchmaker admin: ${MATCHMAKER_ADMIN_EMAIL} / ${MATCHMAKER_ADMIN_PASSWORD}`);
  } catch (error) {
    await t.rollback();
    console.error("Full dataset seeding failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
