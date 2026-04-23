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

const allowedOrigins = [
  "https://admin.rainbowstonerealestate.com",
  "http://localhost:5173"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));

app.use(routes);

app.use((req, res) => res.error(404, "NOT_FOUND"));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message = err.message || "INTERNAL_ERROR";
  return res.error(status, message);
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Kesher API listening on :${port}`);
});

module.exports = app;
