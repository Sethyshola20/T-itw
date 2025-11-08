import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: [
    "./lib/db/schema.ts", // your main schema
    "./lib/db/auth-schema.ts", // include Better Auth tables if present
  ],
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
