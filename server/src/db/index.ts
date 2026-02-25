import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

dotenv.config();

const url =
  process.env.NODE_ENV === "production"
    ? process.env.DB_URL
    : process.env.DB_URL_DEV;
const authToken =
  process.env.NODE_ENV === "production"
    ? process.env.DB_TOKEN
    : process.env.DB_TOKEN_DEV;

if (!url || !authToken) {
  throw new Error("❌ Faltan credenciales de base de datos en .env");
}

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
