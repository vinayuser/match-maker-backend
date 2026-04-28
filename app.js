const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "config/.env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const responses = require("./common/responses");
const routes = require("./routes/index");

const app = express();

app.use(responses());

// Allow everything (No CORS restrictions)
app.use(cors({
  origin: true, // reflect request origin
  credentials: true,
  methods: "*",
  allowedHeaders: "*"
}));

app.options("*", cors()); // Handle preflight for all routes

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

app.use(routes);

app.use((req, res) => res.error(404, "NOT_FOUND"));

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  return res.error(status, err.message || "INTERNAL_ERROR");
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Kesher API listening on :${port}`);
});

module.exports = app;