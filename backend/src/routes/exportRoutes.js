const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { exportJson, exportMarkdown, exportPdf } = require("../controllers/exportController");

const router = express.Router();
router.use(requireAuth);

router.get("/:id/json", exportJson);
router.get("/:id/markdown", exportMarkdown);
router.get("/:id/pdf", exportPdf);

module.exports = router;
