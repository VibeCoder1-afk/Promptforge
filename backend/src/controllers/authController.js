const jwt = require("jsonwebtoken");
const User = require("../models/User");

const DEMO_EMAIL = "demo@promptforge.dev";
const DEMO_PASSWORD = "demo1234";

function signToken(user) {
  return jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, and password are required" });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const user = new User({ name, email });
  await user.setPassword(password);
  await user.save();

  return res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  return res.json({ token: signToken(user), user: user.toSafeJSON() });
}

async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

// Self-provisioning: creates the demo user the first time it's called if it doesn't
// exist yet (e.g. on a fresh deploy where the seed script was never run against this
// database), then logs in as normal. Safe to call repeatedly.
async function demoLogin(req, res) {
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = new User({ name: "Demo", email: DEMO_EMAIL });
    await user.setPassword(DEMO_PASSWORD);
    await user.save();
  }

  return res.json({ token: signToken(user), user: user.toSafeJSON() });
}

module.exports = { register, login, me, demoLogin };
