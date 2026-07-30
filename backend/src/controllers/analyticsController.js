const Prompt = require("../models/Prompt");
const Evaluation = require("../models/Evaluation");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function dashboard(req, res) {
  const owner = req.user._id;
  const [totalPrompts, evals] = await Promise.all([
    Prompt.countDocuments({ owner }),
    Evaluation.find({ createdBy: owner }),
  ]);

  const successCount = evals.filter((e) => e.status === "success").length;
  const successRate = evals.length ? +((successCount / evals.length) * 100).toFixed(1) : 0;
  const avgLatency = evals.length ? Math.round(evals.reduce((s, e) => s + e.latencyMs, 0) / evals.length) : 0;
  const tokensUsed = evals.reduce((s, e) => s + e.tokensInput + e.tokensOutput, 0);
  const totalCost = +evals.reduce((s, e) => s + e.costUsd, 0).toFixed(4);
  const rated = evals.filter((e) => e.starRating != null);
  const avgRating = rated.length ? +(rated.reduce((s, e) => s + e.starRating, 0) / rated.length).toFixed(2) : null;

  res.json({
    totalPrompts,
    successRate,
    avgLatencyMs: avgLatency,
    tokensUsed,
    totalCostUsd: totalCost,
    avgRating,
  });
}

async function latencyGraph(req, res) {
  const evals = await Evaluation.find({ createdBy: req.user._id }).sort({ createdAt: 1 }).limit(200);
  const points = evals.map((e) => ({ timestamp: e.createdAt, latencyMs: e.latencyMs, provider: e.provider }));
  res.json({ points });
}

async function costTracker(req, res) {
  const owner = req.user._id;
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  const [todayEvals, monthEvals] = await Promise.all([
    Evaluation.find({ createdBy: owner, createdAt: { $gte: todayStart } }),
    Evaluation.find({ createdBy: owner, createdAt: { $gte: monthStart } }),
  ]);

  res.json({
    today: +todayEvals.reduce((s, e) => s + e.costUsd, 0).toFixed(4),
    thisMonth: +monthEvals.reduce((s, e) => s + e.costUsd, 0).toFixed(4),
  });
}

async function promptHistory(req, res) {
  const owner = req.user._id;
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [today, yesterday, lastWeek] = await Promise.all([
    Evaluation.find({ createdBy: owner, createdAt: { $gte: todayStart } }).sort({ createdAt: -1 }).populate("prompt", "title"),
    Evaluation.find({ createdBy: owner, createdAt: { $gte: yesterdayStart, $lt: todayStart } }).sort({ createdAt: -1 }).populate("prompt", "title"),
    Evaluation.find({ createdBy: owner, createdAt: { $gte: weekStart, $lt: yesterdayStart } }).sort({ createdAt: -1 }).populate("prompt", "title"),
  ]);

  res.json({ today, yesterday, lastWeek });
}

module.exports = { dashboard, latencyGraph, costTracker, promptHistory };
