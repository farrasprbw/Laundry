import { db } from './src/db/index.js';
await db.execute('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" text');
console.log("Added phone column");
process.exit(0);
