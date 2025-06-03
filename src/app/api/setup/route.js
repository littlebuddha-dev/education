// littlebuddha-dev/education/src/app/api/setup/route.js
import { promises as fs } from 'fs';
import path from 'path';
import { query, getClient, releaseClient, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  // 環境変数から秘密鍵を取得
  const SETUP_SECRET_KEY = process.env.SETUP_SECRET_KEY;

  // リクエストヘッダーから秘密鍵を取得
  const requestSecret = req.headers.get('x-setup-secret-key');

  // 秘密鍵が一致しない場合は拒否
  if (!SETUP_SECRET_KEY || requestSecret !== SETUP_SECRET_KEY) {
    console.warn('Unauthorized setup attempt: Invalid or missing secret key.');
    return Response.json({ error: 'Unauthorized: Invalid setup secret key' }, { status: 401 });
  }

  const { adminEmail, adminPassword } = await req.json();

  if (!adminEmail || !adminPassword) {
    return Response.json({ error: '管理者メールアドレスとパスワードは必須です。' }, { status: 400 });
  }

  let client;
  try {
    client = await getClient();
    await beginTransaction(client);

    // 1. users テーブルが存在するか確認
    // ここでテーブルの存在を確認するのは、schema.sqlの適用が必要かどうかの判断のため
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);
    const usersTableExists = tableCheck.rows[0].exists;

    if (!usersTableExists) {
      console.log('Users table not found. Applying schema.sql...');
      // 2. schema.sql を読み込んで実行
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      const schemaSql = await fs.readFile(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('schema.sql applied successfully.');
    } else {
      console.log('Users table already exists. Skipping schema application.');
    }

    // 3. 管理者ユーザーが存在するか確認
    const adminCheck = await client.query(`SELECT id FROM users WHERE role = 'admin'`);
    const adminExists = adminCheck.rows.length > 0;

    if (!adminExists) {
      console.log('Admin user not found. Creating admin user...');
      // 4. 管理者ユーザーを作成
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [adminEmail, hashedPassword, 'システム', '管理者', 'admin']
      );
      console.log('Admin user created successfully.');
    } else {
      // 管理者ユーザーが既に存在する場合は、エラーとして扱う（再作成を防ぐため）
      await rollbackTransaction(client); // ここでロールバック
      return Response.json({ error: '管理者ユーザーは既に存在します。' }, { status: 409 });
    }

    await commitTransaction(client);
    return Response.json({ message: 'セットアップが完了しました。' });

  } catch (err) {
    if (client) {
      await rollbackTransaction(client);
    }
    console.error('セットアップエラー:', err);
    // データベース接続エラーをより具体的に表示
    if (err.message.includes('connect')) {
      return Response.json({ error: 'データベースに接続できません。PostgreSQLが起動しているか、.env.localの設定を確認してください。' }, { status: 500 });
    }
    return Response.json({ error: err.message || 'セットアップに失敗しました。' }, { status: 500 });
  } finally {
    if (client) {
      releaseClient(client);
    }
  }
}
