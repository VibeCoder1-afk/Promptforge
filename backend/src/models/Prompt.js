const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    collection: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", default: null },
    workspace: {
      type: String,
      enum: ["My Prompts", "Marketing", "Coding", "Interview", "Research", "Email Generator"],
      default: "My Prompts",
    },
    tags: [{ type: String, trim: true }],
    currentVersion: { type: mongoose.Schema.Types.ObjectId, ref: "PromptVersion", default: null },
    isPublicTemplate: { type: Boolean, default: false },
    favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    forkCount: { type: Number, default: 0 },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

promptSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Prompt", promptSchema);
