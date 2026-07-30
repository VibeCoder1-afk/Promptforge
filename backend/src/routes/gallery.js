const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { listPublic, forkPublic } = require("../controllers/galleryController");

const router = express.Router();
router.get("/", listPublic); // public gallery is browsable without auth
router.post("/:id/fork", requireAuth, forkPublic);

module.exports = router;
