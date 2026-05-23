import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../env.js";
import * as schema from "./schema.js";

// Fix for pg 8.x warning: "The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'"
const connectionString = env.DATABASE_URL.includes("sslmode=require")
  ? env.DATABASE_URL.replace("sslmode=require", "sslmode=require&uselibpqcompat=true")
  : env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
