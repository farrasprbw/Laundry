import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  try {
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='user' AND column_name='phone'");
    if (res.rows.length === 0) {
      await client.query("ALTER TABLE \"user\" ADD COLUMN \"phone\" text;");
      console.log("Added phone column to user");
    }
    
    const res2 = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='categories' AND column_name='estimated_duration_minutes'");
    if (res2.rows.length > 0) {
      await client.query("ALTER TABLE \"categories\" RENAME COLUMN \"estimated_duration_minutes\" TO \"estimated_duration_days\";");
      console.log("Renamed estimated_duration_minutes to estimated_duration_days");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
