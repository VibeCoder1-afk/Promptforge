const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { listCollections, createCollection, deleteCollection } = require("../controllers/collectionController");

const router = express.Router();
router.use(requireAuth);

router.get("/", listCollections);
router.post("/", createCollection);
router.delete("/:id", deleteCollection);

module.exports = router;
