const crypto = require("crypto");
const Prompt = require("../models/Prompt");
const PromptVersion = require("../models/PromptVersion");
const Evaluation = require("../models/Evaluation");
const { runPrompt, scorePrompt, DEFAULT_MODEL } = require("../services/aiProviders");

async function runOne({ promptId, versionId, provider, model, variableValues, userId, abGroup = null, abLabel = null }) {
  const version = await PromptVersion.findOne({ _id: versionId, prompt: promptId });
  if (!version) throw Object.assign(new Error("Version not found"), { status: 404 });

  let result;
  let status = "success";
  let errorMessage = "";
  try {
    result = await runPrompt({
      provider,
      model,
      content: version.content,
      variableValues,
      jsonMode: version.jsonMode,
    });
  } catch (err) {
    status = "error";
    errorMessage = err.message;
    result = {
      renderedPrompt: version.content,
      output: "",
      tokensInput: 0,
      tokensOutput: 0,
      latencyMs: 0,
      costUsd: 0,
      isJsonValid: null,
      model: model || DEFAULT_MODEL[provider] || "unknown",
    };
  }

  const heuristics = scorePrompt(version.content);

  const evaluation = await Evaluation.create({
    promptVersion: version._id,
    prompt: promptId,
    createdBy: userId,
    provider,
    model: result.model || model,
    variableValues,
    renderedPrompt: result.renderedPrompt,
    output: result.output,
    isJsonValid: result.isJsonValid,
    abGroup,
    abLabel,
    latencyMs: result.latencyMs,
    tokensInput: result.tokensInput,
    tokensOutput: result.tokensOutput,
    costUsd: result.costUsd,
    promptScore: heuristics,
    status,
    errorMessage,
  });

  return evaluation;
}

// Single run against one model
async function evaluate(req, res) {
  const { promptId, versionId, provider, model, variableValues } = req.body;
  if (!promptId || !versionId || !provider) return res.status(400).json({ error: "promptId, versionId, and provider are required" });

  const prompt = await Prompt.findOne({ _id: promptId, owner: req.user._id });
  if (!prompt) return res.status(404).json({ error: "Prompt not found" });

  const evaluation = await runOne({ promptId, versionId, provider, model, variableValues, userId: req.user._id });
  res.status(201).json({ evaluation });
}

// Compare models: run the same rendered prompt across multiple providers at once
async function compareModels(req, res) {
  const { promptId, versionId, providers, variableValues } = req.body;
  if (!promptId || !versionId || !Array.isArray(providers) || providers.length === 0) {
    return res.status(400).json({ error: "promptId, versionId, and a non-empty providers array are required" });
  }
  const prompt = await Prompt.findOne({ _id: promptId, owner: req.user._id });
  if (!prompt) return res.status(404).json({ error: "Prompt not found" });

  const evaluations = await Promise.all(
    providers.map((p) => runOne({ promptId, versionId, provider: p.provider, model: p.model, variableValues, userId: req.user._id }))
  );

  res.status(201).json({ evaluations });
}

// A/B test: run two prompt versions (or the same version with two variable sets) side by side
async function abTest(req, res) {
  const { promptId, versionAId, versionBId, provider, model, variableValues } = req.body;
  if (!promptId || !versionAId || !versionBId || !provider) {
    return res.status(400).json({ error: "promptId, versionAId, versionBId, and provider are required" });
  }
  const prompt = await Prompt.findOne({ _id: promptId, owner: req.user._id });
  if (!prompt) return res.status(404).json({ error: "Prompt not found" });

  const abGroup = crypto.randomUUID();
  const [evalA, evalB] = await Promise.all([
    runOne({ promptId, versionId: versionAId, provider, model, variableValues, userId: req.user._id, abGroup, abLabel: "A" }),
    runOne({ promptId, versionId: versionBId, provider, model, variableValues, userId: req.user._id, abGroup, abLabel: "B" }),
  ]);

  res.status(201).json({ abGroup, evaluationA: evalA, evaluationB: evalB });
}

// Human rating: 5-star or per-criterion (accuracy, creativity, relevance, JSON validity)
async function rateEvaluation(req, res) {
  const { starRating, criteria } = req.body;
  const evaluation = await Evaluation.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!evaluation) return res.status(404).json({ error: "Evaluation not found" });

  if (starRating !== undefined) evaluation.starRating = starRating;
  if (criteria) evaluation.criteria = { ...evaluation.criteria.toObject(), ...criteria };
  await evaluation.save();

  res.json({ evaluation });
}

async function listEvaluations(req, res) {
  const { promptId } = req.query;
  const filter = { createdBy: req.user._id };
  if (promptId) filter.prompt = promptId;
  const evaluations = await Evaluation.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ evaluations });
}

module.exports = { evaluate, compareModels, abTest, rateEvaluation, listEvaluations };
