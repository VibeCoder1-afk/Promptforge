const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  listPrompts, getPrompt, createPrompt, updatePrompt, deletePrompt, toggleFavorite,
} = require("../controllers/promptController");
const {
  listVersions, createVersion, rollback, duplicatePrompt, compareVersions,
} = require("../controllers/versionController");

const router = express.Router();
router.use(requireAuth);

router.get("/", listPrompts);
router.post("/", createPrompt);
router.get("/:id", getPrompt);
router.patch("/:id", updatePrompt);
router.delete("/:id", deletePrompt);
router.post("/:id/favorite", toggleFavorite);
router.post("/:id/duplicate", duplicatePrompt);

router.get("/:promptId/versions", listVersions);
router.post("/:promptId/versions", createVersion);
router.post("/:promptId/versions/:versionNumber/rollback", rollback);
router.get("/:promptId/versions/diff", compareVersions);

module.exports = router;
