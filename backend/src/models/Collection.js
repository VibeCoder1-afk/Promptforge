const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    color: { type: String, default: "#7C5CFF" },
  },
  { timestamps: true }
);

collectionSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Collection", collectionSchema);
