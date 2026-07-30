const crypto = require("crypto");
const Team = require("../models/Team");
const User = require("../models/User");

async function createTeam(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const inviteCode = crypto.randomBytes(4).toString("hex");
  const team = await Team.create({ name, owner: req.user._id, members: [req.user._id], inviteCode });

  req.user.team = team._id;
  await req.user.save();

  res.status(201).json({ team });
}

async function getMyTeam(req, res) {
  if (!req.user.team) return res.json({ team: null });
  const team = await Team.findById(req.user.team).populate("members", "name email avatarColor");
  res.json({ team });
}

async function joinTeam(req, res) {
  const { inviteCode } = req.body;
  const team = await Team.findOne({ inviteCode });
  if (!team) return res.status(404).json({ error: "Invalid invite code" });

  if (!team.members.map(String).includes(req.user._id.toString())) {
    team.members.push(req.user._id);
    await team.save();
  }
  req.user.team = team._id;
  await req.user.save();

  res.json({ team });
}

async function leaveTeam(req, res) {
  if (!req.user.team) return res.json({ success: true });
  const team = await Team.findById(req.user.team);
  if (team) {
    team.members = team.members.filter((m) => m.toString() !== req.user._id.toString());
    await team.save();
  }
  req.user.team = null;
  await req.user.save();
  res.json({ success: true });
}

module.exports = { createTeam, getMyTeam, joinTeam, leaveTeam };
