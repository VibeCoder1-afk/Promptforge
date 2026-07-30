const Prompt = require("../models/Prompt");
const PromptVersion = require("../models/PromptVersion");

async function listPublic(req, res) {
  const { q } = req.query;
  const filter = { isPublicTemplate: true };
  if (q) filter.$text = { $search: q };

  const prompts = await Prompt.find(filter)
    .populate("currentVersion")
    .populate("owner", "name avatarColor")
    .sort({ forkCount: -1, updatedAt: -1 })
    .limit(60);

  res.json({ prompts });
}

async function forkPublic(req, res) {
  const original = await Prompt.findOne({ _id: req.params.id, isPublicTemplate: true }).populate("currentVersion");
  if (!original) return res.status(404).json({ error: "Public prompt not found" });

  const copy = await Prompt.create({
    title: `${original.title} (forked)`,
    description: original.description,
    workspace: "My Prompts",
    tags: original.tags,
    owner: req.user._id,
  });

  const version = await PromptVersion.create({
    prompt: copy._id,
    versionNumber: 1,
    content: original.currentVersion?.content || "",
    notes: `Forked from "${original.title}"`,
    createdBy: req.user._id,
  });

  copy.currentVersion = version._id;
  await copy.save();

  original.forkCount += 1;
  await original.save();

  res.status(201).json({ prompt: copy });
}

module.exports = { listPublic, forkPublic };
