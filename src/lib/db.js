// littlebuddha-dev/education/education-676d25275fadd678f043e2a225217161a768db69/src/lib/db.js
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

// プールが接続エラーを発生させた場合のイベントリスナーを追加
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // プロセスを終了させるのではなく、エラーをログに記録し続ける
  // このエラーは通常、後続のクエリで捕捉されるはず
});

export async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    // エラーを再スローし、呼び出し元で捕捉できるようにする
    throw err; // ✅ 変更: エラーを再スロー
  }
}

// ✅ 追加: クライアントを取得
export async function getClient() {
  let client;
  try {
    client = await pool.connect();
    return client;
  } catch (err) {
    console.error('Database client connection error:', err);
    throw err; // ✅ 変更: エラーを再スロー
  }
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
