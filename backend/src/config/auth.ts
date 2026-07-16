import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

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
});
