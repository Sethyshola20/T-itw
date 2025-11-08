import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) throw new Error("Missing POSTGRES_URL environment variable");

const sql = neon(process.env.POSTGRES_URL!);
export const db = drizzle(sql);
