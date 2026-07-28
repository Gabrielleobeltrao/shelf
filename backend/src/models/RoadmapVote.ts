import { Schema, model } from "mongoose";

const roadmapVoteSchema = new Schema(
  {
    featureId: { type: String, required: true },
    // A device-scoped id the client stores locally. Anonymous by design —
    // the roadmap vote is a lightweight community signal, not an account action.
    voterKey: { type: String, required: true },
  },
  { timestamps: true },
);

// One vote per device per feature — a second vote toggles it off instead.
roadmapVoteSchema.index({ featureId: 1, voterKey: 1 }, { unique: true });

export const RoadmapVote = model("RoadmapVote", roadmapVoteSchema);
