import { Schema, model } from "mongoose";

const recipeSchema = new Schema(
  {
    name: { type: String, required: true },
    ingredients: {
      type: [
        {
          itemId: { type: String },
          name: { type: String, required: true },
          quantity: { type: Number, default: 1 },
          unit: { type: String, default: "un" },
          _id: false,
        },
      ],
      default: [],
    },
    // Legacy free-text field, kept only so old recipes still return it for
    // the frontend's one-time fallback into `steps`. No longer written to.
    instructions: { type: String, default: "" },
    steps: { type: [String], default: [] },
    prepTime: { type: Number },
    servings: { type: Number },
    category: { type: String },
    imageUrl: { type: String },
    // Public recipes get a shareable page and (later) show up in
    // cross-user search; private ones are only visible to their owner.
    isPublic: { type: Boolean, default: false },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

export const Recipe = model("Recipe", recipeSchema);
