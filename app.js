const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "config/.env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const responses = require("./common/responses");
const routes = require("./routes/index");

const app = express();

// Trust ngrok / proxy / nginx
app.set("trust proxy", 1);

app.use(responses());

// OPEN CORS (debug mode)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"]
}));

app.options("*", cors());

// Temporarily relax helmet while debugging
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  morgan(
    process.env.NODE_ENV === "production"
      ? "combined"
      : "dev"
  )
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Debug middleware (optional, helps trace requests)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  console.log("Origin:", req.headers.origin);
  console.log("Authorization:", req.headers.authorization ? "Present" : "Missing");
  next();
});

// Routes
app.use(routes);

// 404
app.use((req, res) => res.error(404, "NOT_FOUND"));

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // if CORS throws error, expose it
  if (err.message && err.message.includes("CORS")) {
    return res.status(500).json({
      error: err.message
    });
  }

  const status =
    err.status && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  return res.error(
    status,
    err.message || "INTERNAL_ERROR"
  );
});

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`Kesher API listening on :${port}`);
});

module.exports = app;