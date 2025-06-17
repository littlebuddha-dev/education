// src/app/api/setup/route.js
import { promises as fs } from 'fs';
import path from 'path';
import { query, getClient, releaseClient, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  const SETUP_SECRET_KEY = process.env.SETUP_SECRET_KEY;
  const requestSecret = req.headers.get('x-setup-secret-key');

  console.log('API /api/setup: リクエスト受信'); // 追加
  console.log('SETUP_SECRET_KEY (env):', SETUP_SECRET_KEY ? '設定済み' : '未設定'); // 追加
  console.log('requestSecret (header):', requestSecret ? '設定済み' : '未設定'); // 追加

  if (!SETUP_SECRET_KEY || requestSecret !== SETUP_SECRET_KEY) {
    console.warn('Unauthorized setup attempt: Invalid or missing secret key.'); // 追加
    return Response.json({ error: 'Unauthorized: Invalid setup secret key' }, { status: 401 });
  }

  const { adminEmail, adminPassword } = await req.json();
  console.log('adminEmail:', adminEmail); // 追加

  if (!adminEmail || !adminPassword) {
    return Response.json({ error: '管理者メールアドレスとパスワードは必須です。' }, { status: 400 });
  }

  let client;
  try {
    client = await getClient();
    console.log('データベースクライアント接続成功。トランザクション開始。'); // 追加
    await beginTransaction(client);

    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);
    const usersTableExists = tableCheck.rows[0].exists;
    console.log('usersTableExists:', usersTableExists); // 追加

    if (!usersTableExists) {
      console.log('Users table not found. Applying schema.sql...'); // 追加
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('schema.sql applied successfully.'); // 追加
    } else {
      console.log('Users table already exists. Skipping schema application.'); // 追加
    }

    const adminCheck = await client.query(`SELECT id FROM users WHERE role = 'admin'`);
    const adminExists = adminCheck.rows.length > 0;
    console.log('adminExists:', adminExists); // 追加

    if (!adminExists) {
      console.log('Admin user not found. Creating admin user...'); // 追加
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [adminEmail, hashedPassword, 'システム', '管理者', 'admin']
      );
      console.log('Admin user created successfully.'); // 追加
    } else {
      console.log('管理者ユーザーは既に存在します。ロールバックします。'); // 追加
      await rollbackTransaction(client);
      return Response.json({ error: '管理者ユーザーは既に存在します。' }, { status: 409 });
    }

    await commitTransaction(client);
    console.log('トランザクションコミット成功。セットアップ完了。'); // 追加
    return Response.json({ message: 'セットアップが完了しました。' });

  } catch (err) {
    if (client) {
      console.error('セットアップエラー発生、トランザクションロールバック中:', err); // 追加
      await rollbackTransaction(client);
    }
    console.error('セットアップエラー:', err); // 追加
    if (err.message.includes('connect')) {
      return Response.json({ error: 'データベースに接続できません。PostgreSQLが起動しているか、.env.localの設定を確認してください。' }, { status: 500 });
    }
    return Response.json({ error: err.message || 'セットアップに失敗しました。' }, { status: 500 });
  } finally {
    if (client) {
      releaseClient(client);
      console.log('データベースクライアント解放。'); // 追加
    }
  }
}