require("dotenv").config();
require("express-async-errors"); // lets async controller errors reach the error handler below
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const promptRoutes = require("./routes/prompts");
const evaluateRoutes = require("./routes/evaluate");
const analyticsRoutes = require("./routes/analytics");
const collectionRoutes = require("./routes/collections");
const teamRoutes = require("./routes/teams");
const galleryRoutes = require("./routes/gallery");
const exportRoutes = require("./routes/exportRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "promptforge-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/evaluate", evaluateRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/export", exportRoutes);

// Central error handler — controllers can throw { status, message } and land here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] PromptForge API listening on port ${PORT}`));
});

module.exports = app;
