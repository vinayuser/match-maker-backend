const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../config/.env") });

const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { sequelize, User, UserProfile } = require("../models");

const DEFAULT_PASSWORD = "User@12345";
const EMAIL_PREFIX = "seed.discovery";
const DEFAULT_COUNT = 200;

const MALE_FIRST_NAMES = [
  "Aaron", "Ben", "David", "Eli", "Gabriel", "Isaac", "Jacob", "Levi", "Michael", "Noam",
  "Oren", "Reuben", "Samuel", "Yosef", "Yonatan"
];
const FEMALE_FIRST_NAMES = [
  "Abigail", "Adina", "Chaya", "Deborah", "Esther", "Hannah", "Leah", "Miriam", "Naomi", "Rachel",
  "Rivka", "Sara", "Shira", "Tamar", "Yael"
];
const LAST_NAMES = [
  "Adler", "Baruch", "Cohen", "Friedman", "Goldberg", "Halevi", "Katz", "Levin", "Mendel", "Natan",
  "Rosen", "Shapiro", "Stein", "Weiss", "Zamir"
];
const CITY_COUNTRY = [
  { city: "Jerusalem", country: "Israel" },
  { city: "Tel Aviv", country: "Israel" },
  { city: "Haifa", country: "Israel" },
  { city: "Raanana", country: "Israel" },
  { city: "Netanya", country: "Israel" },
  { city: "Modiin", country: "Israel" },
  { city: "Ashdod", country: "Israel" },
  { city: "London", country: "United Kingdom" },
  { city: "New York", country: "United States" },
  { city: "Paris", country: "France" }
];
const RELIGIOUS_LEVELS = ["Orthodox", "Modern Orthodox", "Traditional", "Conservative"];
const SHABBAT_LEVELS = ["strict", "observant", "traditional"];
const EDUCATION_LEVELS = ["Bachelors", "Masters", "PhD", "Professional"];
const OCCUPATIONS = [
  "Software Engineer",
  "Teacher",
  "Product Manager",
  "Doctor",
  "Attorney",
  "Financial Analyst",
  "Architect",
  "Research Scientist"
];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickAge() {
  return randomInt(22, 40);
}

function birthDateForAge(age) {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = randomInt(0, 11);
  const day = randomInt(1, 28);
  return new Date(Date.UTC(year, month, day));
}

function buildProfileRow(index) {
  const gender = index % 2 === 0 ? "male" : "female";
  const firstName = gender === "male" ? randomFrom(MALE_FIRST_NAMES) : randomFrom(FEMALE_FIRST_NAMES);
  const lastName = randomFrom(LAST_NAMES);
  const age = pickAge();
  const prefMin = Math.max(21, age - randomInt(1, 4));
  const prefMax = age + randomInt(2, 6);
  const location = randomFrom(CITY_COUNTRY);
  const religiousLevel = randomFrom(RELIGIOUS_LEVELS);
  const shabbatObservance = randomFrom(SHABBAT_LEVELS);
  const occupation = randomFrom(OCCUPATIONS);
  const educationLevel = randomFrom(EDUCATION_LEVELS);
  const lookingForGender = gender === "male" ? "female" : "male";
  const preferredLifestyle = shabbatObservance;

  return {
    firstName,
    lastName,
    gender,
    lookingForGender,
    city: location.city,
    country: location.country,
    age,
    preferredAgeMin: prefMin,
    preferredAgeMax: prefMax,
    religiousLevel,
    preferredReligiousLevel: religiousLevel,
    shabbatObservance,
    preferredLifestyle,
    occupation,
    educationLevel,
    preferredBackground: occupation.split(" ").slice(-1)[0],
    bio: `${firstName} ${lastName} is looking for a serious and values-based relationship.`,
    isCohen: gender === "male" && Math.random() < 0.15 ? 1 : 0,
    maritalStatus: Math.random() < 0.82 ? "single" : Math.random() < 0.6 ? "divorced" : "widowed"
  };
}

async function run() {
  const resetOnly = process.argv.includes("--reset");
  const countArg = process.argv.find((arg) => arg.startsWith("--count="));
  const requestedCount = countArg ? Number(countArg.split("=")[1]) : DEFAULT_COUNT;
  const safeCount = Number.isFinite(requestedCount) ? Math.max(1, Math.min(1000, Math.floor(requestedCount))) : DEFAULT_COUNT;
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const t = await sequelize.transaction();
  try {
    const existingUsers = await User.findAll({
      where: { email: { [Op.like]: `${EMAIL_PREFIX}.%@matchmaker.local` } },
      attributes: ["id"],
      transaction: t
    });
    const existingIds = existingUsers.map((u) => u.id);

    if (existingIds.length) {
      await User.destroy({ where: { id: existingIds }, transaction: t });
    }

    if (!resetOnly) {
      for (let i = 0; i < safeCount; i += 1) {
        const seed = buildProfileRow(i);
        const user = await User.create(
          {
            email: `${EMAIL_PREFIX}.${String(i + 1).padStart(3, "0")}@matchmaker.local`,
            passwordHash
          },
          { transaction: t }
        );

        await UserProfile.create(
          {
            userId: user.id,
            firstName: seed.firstName,
            lastName: seed.lastName,
            gender: seed.gender,
            dateOfBirth: birthDateForAge(seed.age),
            city: seed.city,
            country: seed.country,
            occupation: seed.occupation,
            educationLevel: seed.educationLevel,
            religiousLevel: seed.religiousLevel,
            shabbatObservance: seed.shabbatObservance,
            maritalStatus: seed.maritalStatus,
            isCohen: seed.isCohen,
            aboutMe: seed.bio,
            lookingForGender: seed.lookingForGender,
            preferredAgeMin: seed.preferredAgeMin,
            preferredAgeMax: seed.preferredAgeMax,
            preferredLocation: `${seed.city}, ${seed.country}`,
            preferredReligiousLevel: seed.preferredReligiousLevel,
            preferredLifestyle: seed.preferredLifestyle,
            preferredBackground: seed.preferredBackground,
            profileStatus: "active",
            verificationStatus: "verified",
            isLocked: 0,
            onboardingCompletedAt: new Date(Date.now() - i * 15 * 60 * 1000),
            internalNotes: "Seeded by seedDiscoveryUsers script"
          },
          { transaction: t }
        );
      }
    }

    await t.commit();
    const verifiedCount = await UserProfile.count({
      where: {
        profileStatus: "active",
        verificationStatus: "verified"
      }
    });
    console.log(
      resetOnly
        ? "Discovery users seed reset completed."
        : `Discovery users seed completed. Generated ${safeCount} approved users.`
    );
    console.log(`Total active + verified profiles currently in system: ${verifiedCount}`);
    console.log(`Seeded user password for all generated users: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    await t.rollback();
    console.error("Discovery seeding failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
