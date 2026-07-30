const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createTeam, getMyTeam, joinTeam, leaveTeam } = require("../controllers/teamController");

const router = express.Router();
router.use(requireAuth);

router.get("/me", getMyTeam);
router.post("/", createTeam);
router.post("/join", joinTeam);
router.post("/leave", leaveTeam);

module.exports = router;
