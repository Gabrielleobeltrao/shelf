import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { Item } from "../models/Item.js";
import { Recipe } from "../models/Recipe.js";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI não definida no .env");
}

const client = new MongoClient(uri);
await client.connect();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4001",
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(client.db()),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.CLIENT_URL ?? "http://localhost:5183"],
  advanced: {
    // Cookies aren't scoped by port, only by host — without a distinct
    // prefix this collides with any other "localhost" Better Auth app
    // (e.g. comunicacaoAI), each overwriting the other's session cookie.
    cookiePrefix: "shelf",
  },
  user: {
    changeEmail: {
      enabled: true,
      // We never send verification emails (no SMTP configured), and
      // emailVerified is always false in this app, so this is the only
      // way changeEmail can work at all.
      updateEmailWithoutVerification: true,
    },
    deleteUser: {
      enabled: true,
      afterDelete: async (user) => {
        await Item.deleteMany({ userId: user.id });
        await Recipe.deleteMany({ userId: user.id });
      },
    },
  },
});
