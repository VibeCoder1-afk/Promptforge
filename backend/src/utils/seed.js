require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Collection = require("../models/Collection");
const Prompt = require("../models/Prompt");
const PromptVersion = require("../models/PromptVersion");

async function seed() {
  await connectDB();

  let user = await User.findOne({ email: "demo@promptforge.dev" });
  if (!user) {
    user = new User({ name: "Demo User", email: "demo@promptforge.dev" });
    await user.setPassword("demo1234");
    await user.save();
    console.log("Created demo user: demo@promptforge.dev / demo1234");
  }

  const sales = await Collection.findOneAndUpdate(
    { owner: user._id, name: "Sales" },
    { owner: user._id, name: "Sales", color: "#FFB86B" },
    { upsert: true, new: true }
  );

  const existing = await Prompt.findOne({ owner: user._id, title: "Cold Outreach Email" });
  if (!existing) {
    const prompt = await Prompt.create({
      title: "Cold Outreach Email",
      description: "Generates a short, personalized cold email",
      workspace: "Email Generator",
      collection: sales._id,
      tags: ["sales", "email"],
      owner: user._id,
      isPublicTemplate: true,
    });

    const version = await PromptVersion.create({
      prompt: prompt._id,
      versionNumber: 1,
      content:
        "You are a sales rep at {{company}}. Write a concise, friendly cold email to {{name}} " +
        "for the role of {{role}}, in under 120 words. No generic filler.",
      notes: "Initial version",
      createdBy: user._id,
    });

    prompt.currentVersion = version._id;
    await prompt.save();
    console.log("Seeded sample prompt: Cold Outreach Email");
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
