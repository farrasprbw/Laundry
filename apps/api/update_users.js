import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client(process.env.DATABASE_URL);

async function run() {
  await client.connect();
  try {
    const res = await client.query('SELECT id, email, username FROM "user"');
    console.log("Current users:", res.rows);
    for (let i = 0; i < res.rows.length; i++) {
      const user = res.rows[i];
      if (!user.username) {
        const username = user.email.split('@')[0] + '_' + i;
        await client.query('UPDATE "user" SET username = $1 WHERE id = $2', [username, user.id]);
        console.log(`Updated user ${user.id} username to ${username}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
