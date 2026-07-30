const mongoose = require("mongoose");

const promptVersionSchema = new mongoose.Schema(
  {
    prompt: { type: mongoose.Schema.Types.ObjectId, ref: "Prompt", required: true },
    versionNumber: { type: Number, required: true },
    content: { type: String, required: true }, // raw text with {{variables}}
    variables: [{ type: String }], // extracted variable names, e.g. ["name", "company", "role"]
    jsonMode: { type: Boolean, default: false },
    functionCallingEnabled: { type: Boolean, default: false },
    notes: { type: String, default: "" }, // "what changed" message, git-commit style
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

promptVersionSchema.index({ prompt: 1, versionNumber: 1 }, { unique: true });

// Auto-extract {{variable}} names from content before validation
promptVersionSchema.pre("validate", function (next) {
  if (this.content) {
    const matches = [...this.content.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)];
    this.variables = [...new Set(matches.map((m) => m[1]))];
  }
  next();
});

module.exports = mongoose.model("PromptVersion", promptVersionSchema);
