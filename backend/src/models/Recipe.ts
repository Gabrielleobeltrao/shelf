import { Schema, model } from "mongoose";

const recipeSchema = new Schema(
  {
    name: { type: String, required: true },
    ingredients: { type: [String], default: [] },
    instructions: { type: String, default: "" },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

export const Recipe = model("Recipe", recipeSchema);
