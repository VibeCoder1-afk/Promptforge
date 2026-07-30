const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { evaluate, compareModels, abTest, rateEvaluation, listEvaluations } = require("../controllers/evaluateController");

const router = express.Router();
router.use(requireAuth);

router.get("/", listEvaluations);
router.post("/", evaluate);
router.post("/compare", compareModels);
router.post("/ab-test", abTest);
router.post("/:id/rate", rateEvaluation);

module.exports = router;
