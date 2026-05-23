import { db } from './src/db/index.js';
const res = await db.execute(`SELECT id, name, username FROM "user"`);
console.log(res.rows);
process.exit(0);
