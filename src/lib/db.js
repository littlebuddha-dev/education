// src/lib/db.js
import { Pool } from 'pg';

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

export async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    // エラーオブジェクトにrowsプロパティが存在しない可能性があるため、安全にアクセス
    return { rows: [], error: err };
  }
}

// ✅ 追加: クライアントを取得
export async function getClient() {
  const client = await pool.connect();
  return client;
}

// ✅ 追加: クライアントを解放
export function releaseClient(client) {
  client.release();
}

// ✅ 追加: トランザクション開始
export async function beginTransaction(client) {
  await client.query('BEGIN');
}

// ✅ 追加: トランザクションコミット
export async function commitTransaction(client) {
  await client.query('COMMIT');
}

// ✅ 追加: トランザクションロールバック
export async function rollbackTransaction(client) {
  await client.query('ROLLBACK');
}
