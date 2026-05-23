import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client(process.env.DATABASE_URL);

async function run() {
  await client.connect();
  try {
    await client.query('ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username")');
    console.log("Added unique constraint on username");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
