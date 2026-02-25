import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url:
      process.env.NODE_ENV === "production"
        ? process.env.DB_URL!
        : process.env.DB_URL_DEV!,
    authToken:
      process.env.NODE_ENV === "production"
        ? process.env.DB_TOKEN!
        : process.env.DB_TOKEN_DEV!,
  },
});
