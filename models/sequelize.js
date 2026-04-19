const path = require("path");
const { Sequelize } = require("sequelize");

require("dotenv").config({ path: path.resolve(__dirname, "../config/.env") });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? false : false,
    pool: {
      max: Number(process.env.DB_POOL_LIMIT || 20),
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      charset: "utf8mb4",
      decimalNumbers: true
    },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

module.exports = sequelize;
