// reset-admin.js
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function resetAdmin() {
  try {
    const email = 'admin@example.com';
    const password = 'adminpassword';
    
    // 現在の環境でハッシュ化
    const hash = await bcrypt.hash(password, 10);
    
    const res = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id`,
      [hash, email]
    );

    if (res.rowCount > 0) {
      console.log(`✅ Password for ${email} has been updated successfully.`);
    } else {
      console.error(`❌ User ${email} not found. Make sure seed data is inserted.`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

resetAdmin();