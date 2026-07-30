const Prompt = require("../models/Prompt");
const PromptVersion = require("../models/PromptVersion");

async function assertOwnedPrompt(promptId, userId) {
  const prompt = await Prompt.findOne({ _id: promptId, owner: userId });
  if (!prompt) throw Object.assign(new Error("Prompt not found"), { status: 404 });
  return prompt;
}

async function listVersions(req, res) {
  const prompt = await assertOwnedPrompt(req.params.promptId, req.user._id);
  const versions = await PromptVersion.find({ prompt: prompt._id }).sort({ versionNumber: -1 });
  res.json({ versions, currentVersion: prompt.currentVersion });
}

async function createVersion(req, res) {
  const prompt = await assertOwnedPrompt(req.params.promptId, req.user._id);
  const { content, notes, jsonMode, functionCallingEnabled } = req.body;
  if (content === undefined) return res.status(400).json({ error: "content is required" });

  const latest = await PromptVersion.findOne({ prompt: prompt._id }).sort({ versionNumber: -1 });
  const nextNumber = latest ? latest.versionNumber + 1 : 1;

  const version = await PromptVersion.create({
    prompt: prompt._id,
    versionNumber: nextNumber,
    content,
    notes: notes || `v${nextNumber}`,
    jsonMode: !!jsonMode,
    functionCallingEnabled: !!functionCallingEnabled,
    createdBy: req.user._id,
  });

  prompt.currentVersion = version._id;
  await prompt.save();

  res.status(201).json({ version });
}

async function rollback(req, res) {
  const prompt = await assertOwnedPrompt(req.params.promptId, req.user._id);
  const target = await PromptVersion.findOne({ prompt: prompt._id, versionNumber: req.params.versionNumber });
  if (!target) return res.status(404).json({ error: "Version not found" });

  const latest = await PromptVersion.findOne({ prompt: prompt._id }).sort({ versionNumber: -1 });
  const rolledBack = await PromptVersion.create({
    prompt: prompt._id,
    versionNumber: latest.versionNumber + 1,
    content: target.content,
    notes: `Rolled back to v${target.versionNumber}`,
    jsonMode: target.jsonMode,
    functionCallingEnabled: target.functionCallingEnabled,
    createdBy: req.user._id,
  });

  prompt.currentVersion = rolledBack._id;
  await prompt.save();

  res.status(201).json({ version: rolledBack });
}

async function duplicatePrompt(req, res) {
  const prompt = await assertOwnedPrompt(req.params.promptId, req.user._id);
  const versions = await PromptVersion.find({ prompt: prompt._id }).sort({ versionNumber: 1 });

  const copy = await Prompt.create({
    title: `${prompt.title} (copy)`,
    description: prompt.description,
    workspace: prompt.workspace,
    collection: prompt.collection,
    tags: prompt.tags,
    owner: req.user._id,
  });

  let currentVersion = null;
  for (const v of versions) {
    currentVersion = await PromptVersion.create({
      prompt: copy._id,
      versionNumber: v.versionNumber,
      content: v.content,
      notes: v.notes,
      jsonMode: v.jsonMode,
      functionCallingEnabled: v.functionCallingEnabled,
      createdBy: req.user._id,
    });
  }
  copy.currentVersion = currentVersion?._id || null;
  await copy.save();

  res.status(201).json({ prompt: copy });
}

// Simple line-level diff between two versions (no external dep — good enough for a text diff view)
function diffLines(a, b) {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const max = Math.max(aLines.length, bLines.length);
  const result = [];
  for (let i = 0; i < max; i++) {
    const left = aLines[i] ?? null;
    const right = bLines[i] ?? null;
    if (left === right) result.push({ type: "same", left, right });
    else result.push({ type: "changed", left, right });
  }
  return result;
}

async function compareVersions(req, res) {
  const prompt = await assertOwnedPrompt(req.params.promptId, req.user._id);
  const { from, to } = req.query;
  const vFrom = await PromptVersion.findOne({ prompt: prompt._id, versionNumber: from });
  const vTo = await PromptVersion.findOne({ prompt: prompt._id, versionNumber: to });
  if (!vFrom || !vTo) return res.status(404).json({ error: "One or both versions not found" });

  res.json({ diff: diffLines(vFrom.content, vTo.content) });
}

module.exports = { listVersions, createVersion, rollback, duplicatePrompt, compareVersions };
