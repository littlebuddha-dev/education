// scripts/setup-db.js
// 目的: データベースのスキーマ作成と初期データ（シード）の投入

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// ES Modulesで __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local または .env から環境変数を読み込む
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const requiredEnvVars = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.error('❌ Database configuration error: Missing environment variables.');
  console.error(`   Missing: ${missingVars.join(', ')}`);
  process.exit(1);
}

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function setup() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database successfully.');

    // 1. スキーマファイルの読み込みと実行
    // テーブルが存在しない場合作成する、または再作成する処理が含まれていることを想定
    const schemaPath = path.resolve(__dirname, '../schema.sql');
    console.log(`📖 Reading schema from ${schemaPath}...`);
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Schema applied successfully.');

    // 2. シードファイルの読み込みと実行
    // 初期ユーザーデータなどを投入
    const seedPath = path.resolve(__dirname, '../seed.sql');
    console.log(`📖 Reading seed data from ${seedPath}...`);
    const seedSql = await fs.readFile(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('✅ Seed data inserted successfully.');

    console.log('🎉 Database setup completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

setup();