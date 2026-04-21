const fs = require("fs");
const path = require("path");
const { sequelize } = require("../models");

const MIGRATIONS_DIR = path.resolve(__dirname, "../database/migrations");
const STATUS_FLAG = process.argv.includes("--status");

async function ensureMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_name (name)
    ) ENGINE=InnoDB;
  `);
}

async function getAppliedMigrationNames() {
  const [rows] = await sequelize.query("SELECT name FROM schema_migrations ORDER BY id ASC");
  return new Set(rows.map((row) => row.name));
}

function readMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".js"))
    .sort();
}

async function printStatus(migrationFiles, appliedSet) {
  const lines = migrationFiles.map((file) => {
    const state = appliedSet.has(file) ? "applied" : "pending";
    return `${state.padEnd(8)} ${file}`;
  });
  if (lines.length === 0) {
    console.log("No migration files found.");
    return;
  }
  console.log(lines.join("\n"));
}

async function applyPendingMigrations(migrationFiles, appliedSet) {
  const pending = migrationFiles.filter((file) => !appliedSet.has(file));
  if (pending.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const file of pending) {
    const migrationPath = path.join(MIGRATIONS_DIR, file);
    const migration = require(migrationPath);
    if (!migration || typeof migration.up !== "function") {
      throw new Error(`Invalid migration "${file}" - expected export.up function`);
    }

    console.log(`Applying ${file}...`);
    await migration.up({ sequelize });
    await sequelize.query("INSERT INTO schema_migrations (name) VALUES (?)", {
      replacements: [file]
    });
    console.log(`Applied ${file}`);
  }
}

async function main() {
  try {
    await ensureMigrationsTable();
    const appliedSet = await getAppliedMigrationNames();
    const migrationFiles = readMigrationFiles();

    if (STATUS_FLAG) {
      await printStatus(migrationFiles, appliedSet);
      return;
    }

    await applyPendingMigrations(migrationFiles, appliedSet);
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});
