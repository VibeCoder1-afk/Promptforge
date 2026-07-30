const Prompt = require("../models/Prompt");
const PromptVersion = require("../models/PromptVersion");

async function listPrompts(req, res) {
  const { workspace, collection, q, favorites } = req.query;
  const filter = { owner: req.user._id };
  if (workspace) filter.workspace = workspace;
  if (collection) filter.collection = collection;
  if (favorites === "true") filter.favoritedBy = req.user._id;
  if (q) filter.$text = { $search: q };

  const prompts = await Prompt.find(filter).populate("currentVersion").sort({ updatedAt: -1 });
  res.json({ prompts });
}

async function getPrompt(req, res) {
  const prompt = await Prompt.findOne({ _id: req.params.id, owner: req.user._id }).populate("currentVersion");
  if (!prompt) return res.status(404).json({ error: "Prompt not found" });
  res.json({ prompt });
}

async function createPrompt(req, res) {
  const { title, description, workspace, collection, tags, content } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const prompt = await Prompt.create({
    title,
    description,
    workspace,
    collection: collection || null,
    tags: tags || [],
    owner: req.user._id,
  });

  const version = await PromptVersion.create({
    prompt: prompt._id,
    versionNumber: 1,
    content: content && content.trim() ? content : "Write your prompt here...",
    createdBy: req.user._id,
    notes: "Initial version",
  });

  prompt.currentVersion = version._id;
  await prompt.save();

  res.status(201).json({ prompt, version });
}

async function updatePrompt(req, res) {
  const prompt = await Prompt.findOne({ _id: req.params.id, owner: req.user._id });
  if (!prompt) return res.status(404).json({ error: "Prompt not found" });

  const { title, description, workspace, collection, tags, isPublicTemplate } = req.body;
  if (title !== undefined) prompt.title = title;
  if (description !== undefined) prompt.description = description;
  if (workspace !== undefined) prompt.workspace = workspace;
  if (collection !== undefined) prompt.collection = collection;
  if (tags !== undefined) prompt.tags = tags;
  if (isPublicTemplate !== undefined) prompt.isPublicTemplate = isPublicTemplate;

  await prompt.save();
  res.json({ prompt });
}

async function deletePrompt(req, res) {
  const prompt = await Prompt.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!prompt) return res.status(404).json({ error: "Prompt not found" });
  await PromptVersion.deleteMany({ prompt: prompt._id });
  res.json({ success: true });
}

async function toggleFavorite(req, res) {
  const prompt = await Prompt.findById(req.params.id);
  if (!prompt) return res.status(404).json({ error: "Prompt not found" });

  const uid = req.user._id.toString();
  const already = prompt.favoritedBy.map(String).includes(uid);
  prompt.favoritedBy = already
    ? prompt.favoritedBy.filter((id) => id.toString() !== uid)
    : [...prompt.favoritedBy, req.user._id];

  await prompt.save();
  res.json({ favorited: !already });
}

module.exports = { listPrompts, getPrompt, createPrompt, updatePrompt, deletePrompt, toggleFavorite };
