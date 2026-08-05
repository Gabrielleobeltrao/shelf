import { Schema, model } from "mongoose";
import { randomBytes } from "crypto";

const memberSchema = new Schema(
  {
    userId: { type: String, required: true },
    role: { type: String, enum: ["owner", "member"], default: "member" },
  },
  { _id: false },
);

const householdSchema = new Schema(
  {
    name: { type: String, required: true },
    // Short human-friendly code used to invite people into the household.
    inviteCode: { type: String, required: true, unique: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true },
);

export const Household = model("Household", householdSchema);

// Ambiguous characters (0/O, 1/I) left out so codes are easy to read and share.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}

// Generate a code not already taken (collisions are astronomically unlikely,
// but the unique index makes retrying cheap and correct).
export async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = makeCode();
    if (!(await Household.exists({ inviteCode: code }))) return code;
  }
  return makeCode();
}
