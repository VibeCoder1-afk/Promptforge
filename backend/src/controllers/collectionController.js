const Collection = require("../models/Collection");
const Prompt = require("../models/Prompt");

async function listCollections(req, res) {
  const collections = await Collection.find({ owner: req.user._id }).sort({ name: 1 });
  res.json({ collections });
}

async function createCollection(req, res) {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const collection = await Collection.create({ name, color, owner: req.user._id });
  res.status(201).json({ collection });
}

async function deleteCollection(req, res) {
  const collection = await Collection.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!collection) return res.status(404).json({ error: "Collection not found" });
  await Prompt.updateMany({ collection: collection._id }, { $set: { collection: null } });
  res.json({ success: true });
}

module.exports = { listCollections, createCollection, deleteCollection };
