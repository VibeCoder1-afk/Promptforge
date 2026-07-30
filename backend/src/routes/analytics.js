const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { dashboard, latencyGraph, costTracker, promptHistory } = require("../controllers/analyticsController");

const router = express.Router();
router.use(requireAuth);

router.get("/dashboard", dashboard);
router.get("/latency", latencyGraph);
router.get("/cost", costTracker);
router.get("/history", promptHistory);

module.exports = router;
