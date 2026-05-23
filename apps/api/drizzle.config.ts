import { defineConfig } from "drizzle-kit";

// Fix for pg 8.x warning: "The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'"
const databaseUrl = process.env.DATABASE_URL?.includes("sslmode=require")
  ? process.env.DATABASE_URL.replace("sslmode=require", "sslmode=require&uselibpqcompat=true")
  : process.env.DATABASE_URL!;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
