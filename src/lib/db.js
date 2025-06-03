// littlebuddha-dev/education/education-676d25275fadd678f043e2a225217161a768db69/src/lib/db.js
import { Pool } from 'pg';

console.log('DB Config:', {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'user',
  database: process.env.PGDATABASE || 'userdb',
  // password はログに出力しない (セキュリティのため)
}); // ✅ 追加: データベース接続設定のログ

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'user',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'userdb',
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client (from DB Pool):', err); // ✅ ログメッセージを明確化
});

export async function query(text, params) {
  try {
    console.log('Executing query:', text, params); // ✅ 追加: 実行されるクエリのログ
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('Database query error (in query function):', err); // ✅ ログメッセージを明確化
    throw err;
  }
}

export async function getClient() {
  let client;
  try {
    client = await pool.connect();
    console.log('Database client connected successfully.'); // ✅ 追加: 接続成功ログ
    return client;
  } catch (err) {
    console.error('Database client connection error (in getClient function):', err); // ✅ ログメッセージを明確化
    throw err;
  }
}

// ... (rest of the code)
