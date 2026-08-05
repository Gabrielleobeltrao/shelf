import { Schema, model } from "mongoose";

// A change-history entry for a household: who did what. `action` is a stable
// key the client turns into localized text; `detail` holds the item/member
// name when relevant.
const activitySchema = new Schema(
  {
    householdId: { type: String, required: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    detail: { type: String },
  },
  { timestamps: true },
);

activitySchema.index({ householdId: 1, createdAt: -1 });

export const HouseholdActivity = model("HouseholdActivity", activitySchema);
