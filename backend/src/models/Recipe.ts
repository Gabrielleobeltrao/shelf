import { Schema, model } from "mongoose";

const recipeSchema = new Schema(
  {
    name: { type: String, required: true },
    ingredients: {
      type: [
        {
          itemId: { type: String, required: true },
          quantity: { type: Number, default: 1 },
          unit: { type: String, default: "un" },
          _id: false,
        },
      ],
      default: [],
    },
    instructions: { type: String, default: "" },
    imageUrl: { type: String },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

export const Recipe = model("Recipe", recipeSchema);
