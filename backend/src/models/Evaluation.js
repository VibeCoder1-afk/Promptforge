const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
  {
    promptVersion: { type: mongoose.Schema.Types.ObjectId, ref: "PromptVersion", required: true },
    prompt: { type: mongoose.Schema.Types.ObjectId, ref: "Prompt", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    provider: { type: String, enum: ["groq", "gemini", "mistral"], required: true },
    model: { type: String, required: true },

    variableValues: { type: Object, default: {} }, // { company: "Acme", ... }
    renderedPrompt: { type: String, required: true },
    output: { type: String, default: "" },
    isJsonValid: { type: Boolean, default: null },

    // A/B testing: link two evaluations run on the same input for comparison
    abGroup: { type: String, default: null },
    abLabel: { type: String, enum: ["A", "B", null], default: null },

    latencyMs: { type: Number, default: 0 },
    tokensInput: { type: Number, default: 0 },
    tokensOutput: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },

    starRating: { type: Number, min: 1, max: 5, default: null },
    criteria: {
      accuracy: { type: Number, min: 1, max: 5, default: null },
      creativity: { type: Number, min: 1, max: 5, default: null },
      relevance: { type: Number, min: 1, max: 5, default: null },
      jsonValidity: { type: Number, min: 1, max: 5, default: null },
    },
    // heuristic prompt score, computed at write-time (not user given)
    promptScore: {
      clarity: { type: Number, default: null },
      specificity: { type: Number, default: null },
      outputConsistency: { type: Number, default: null },
      hallucinationRisk: { type: Number, default: null },
    },

    status: { type: String, enum: ["success", "error"], default: "success" },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

evaluationSchema.index({ prompt: 1, createdAt: -1 });

module.exports = mongoose.model("Evaluation", evaluationSchema);
