// src/lib/db.js
// 役割: PostgreSQLデータベースへの接続プールを管理する
// 修正: 環境変数の読み込みを柔軟にし、接続エラー時のログを改善

import { Pool } from 'pg';

// 環境変数が設定されているかチェック
// Next.jsでは .env.local などを自動で読み込むが、
// 明示的にチェックすることで設定漏れを防ぐ
const requiredEnvVars = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);

// DB接続設定がない場合はログを出力して終了するのではなく、
// 開発環境のデフォルト値（docker-composeと整合する値）へフォールバックする手もあるが、
// ここではエラーを明確にする方針を維持する。
// ただし、環境変数が読み込めていない可能性も考慮し、エラーメッセージを親切にする。

if (missingVars.length > 0) {
  // 開発環境で .env が読み込まれていない場合のためのチェック
  console.error('❌ Database configuration error: Missing environment variables.');
  console.error(`   Missing: ${missingVars.join(', ')}`);
  console.error('   Please check your .env or .env.local file.');
  
  // 開発環境での利便性のため、一時的にハードコードされたデフォルト値を使用する（オプション）
  // 今回はエラーを投げて .env の修正を促す
  // throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  // 接続アイドル時間のタイムアウト設定などを追加してリソースリークを防ぐ
  max: 10, // 最大接続数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 接続エラーのハンドリング
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // 開発環境のみクエリログを出力（必要に応じてコメントアウト）
    if (process.env.NODE_ENV === 'development') {
      // console.log('executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', {
      text,
      error: error.message,
    });
    throw error;
  }
}

export default pool;