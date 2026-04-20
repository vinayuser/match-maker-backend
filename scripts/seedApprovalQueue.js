const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../config/.env") });

const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { sequelize, User, UserProfile } = require("../models");

const DEFAULT_PASSWORD = "User@12345";
const EMAIL_PREFIX = "seed.approval";

const SEED_PROFILES = [
  { firstName: "Rachel", lastName: "Cohen", gender: "female", city: "Jerusalem", religiousLevel: "Orthodox", decision: "pending" },
  { firstName: "David", lastName: "Levi", gender: "male", city: "Tel Aviv", religiousLevel: "Traditional", decision: "pending" },
  { firstName: "Miriam", lastName: "Stein", gender: "female", city: "Haifa", religiousLevel: "Modern Orthodox", decision: "pending" },
  { firstName: "Yosef", lastName: "Rosen", gender: "male", city: "Bnei Brak", religiousLevel: "Orthodox", decision: "pending" },
  { firstName: "Sara", lastName: "Friedman", gender: "female", city: "Ashdod", religiousLevel: "Conservative", decision: "pending" },
  { firstName: "Ari", lastName: "Katz", gender: "male", city: "Raanana", religiousLevel: "Orthodox", decision: "pending" },
  { firstName: "Leah", lastName: "Baruch", gender: "female", city: "Netanya", religiousLevel: "Traditional", decision: "pending" },
  { firstName: "Noam", lastName: "Halevi", gender: "male", city: "Jerusalem", religiousLevel: "Modern Orthodox", decision: "approved" },
  { firstName: "Tamar", lastName: "Gold", gender: "female", city: "Modiin", religiousLevel: "Orthodox", decision: "approved" },
  { firstName: "Daniel", lastName: "Shapiro", gender: "male", city: "London", religiousLevel: "Traditional", decision: "approved" },
  { firstName: "Rivka", lastName: "Mendel", gender: "female", city: "Paris", religiousLevel: "Conservative", decision: "rejected" },
  { firstName: "Avi", lastName: "Natan", gender: "male", city: "New York", religiousLevel: "Orthodox", decision: "rejected" }
];

function decisionToStatus(decision) {
  if (decision === "approved") {
    return { profileStatus: "active", verificationStatus: "verified" };
  }
  if (decision === "rejected") {
    return { profileStatus: "draft", verificationStatus: "rejected" };
  }
  return { profileStatus: "pending_review", verificationStatus: "pending" };
}

async function run() {
  const resetOnly = process.argv.includes("--reset");
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const t = await sequelize.transaction();
  try {
    const seededUsers = await User.findAll({
      where: { email: { [Op.like]: `${EMAIL_PREFIX}.%@matchmaker.local` } },
      attributes: ["id"],
      transaction: t
    });
    const seededIds = seededUsers.map((u) => u.id);
    if (seededIds.length) {
      await User.destroy({ where: { id: seededIds }, transaction: t });
    }

    if (!resetOnly) {
      for (let i = 0; i < SEED_PROFILES.length; i += 1) {
        const row = SEED_PROFILES[i];
        const status = decisionToStatus(row.decision);
        const user = await User.create(
          {
            email: `${EMAIL_PREFIX}.${String(i + 1).padStart(2, "0")}@matchmaker.local`,
            passwordHash
          },
          { transaction: t }
        );

        await UserProfile.create(
          {
            userId: user.id,
            firstName: row.firstName,
            lastName: row.lastName,
            gender: row.gender,
            city: row.city,
            country: "Israel",
            religiousLevel: row.religiousLevel,
            aboutMe: `${row.firstName} ${row.lastName} seeded profile for admin moderation workflow.`,
            profileStatus: status.profileStatus,
            verificationStatus: status.verificationStatus,
            onboardingCompletedAt: new Date(Date.now() - i * 3600 * 1000),
            internalNotes: "Seeded by seedApprovalQueue script"
          },
          { transaction: t }
        );
      }
    }

    await t.commit();
    const pendingCount = await UserProfile.count({ where: { profileStatus: "pending_review" } });
    console.log(
      resetOnly
        ? "Approval queue seed reset completed."
        : `Approval queue seed completed. Pending profiles available for review: ${pendingCount}`
    );
    console.log(`Seeded user password for all generated users: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    await t.rollback();
    console.error("Seeding failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
