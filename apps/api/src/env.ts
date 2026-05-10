import "dotenv/config";

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  PORT: parseInt(process.env.PORT || "3001", 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
} as const;

// Validate required env vars at startup
const required = ["DATABASE_URL", "BETTER_AUTH_SECRET"] as const;
for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
