// littlebuddha-dev/education/education-main/src/app/api/users/register/route.js
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  // 💡 トランザクション関連のクエリでは client を使用するよう修正
  const client = await getClient(); // 💡 getClient を使用してクライアントを取得

  try {
    await beginTransaction(client); // 💡 client を使用してトランザクション開始

    const { email, password, first_name, last_name, role, birthday } = await req.json();

    const existsResult = await client.query('SELECT 1 FROM users WHERE email = $1', [email]); // 💡 client.query を使用
    if (existsResult.rows.length > 0) {
      await rollbackTransaction(client); // 💡 client を使用
      releaseClient(client); // 💡 クライアントを解放
      return Response.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー登録 (コメントを削除)
    const userResult = await client.query( // 💡 client.query を使用
      `INSERT INTO users (email, password_hash, first_name, last_name, role, birthday)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, role`,
      [email, hashedPassword, first_name, last_name, role || 'parent', birthday]
    );

    const newUser = userResult.rows[0];

    if (newUser.role === 'child') {
      const childName = `${last_name || ''} ${first_name || ''}`.trim();
      if (!childName) {
        await rollbackTransaction(client); // 💡 client を使用
        releaseClient(client); // 💡 クライアントを解放
        return Response.json({ error: '子どもの名前を入力してください' }, { status: 400 });
      }
      // children テーブルへのINSERT (コメントを削除)
      await client.query( // 💡 client.query を使用
        `INSERT INTO children (child_user_id, name, birthday)
         VALUES ($1, $2, $3)`,
        [newUser.id, childName, birthday]
      );
    }

    await commitTransaction(client); // 💡 client を使用
    return Response.json({ message: '登録完了' });
  } catch (err) {
    await rollbackTransaction(client); // 💡 client を使用
    console.error('登録エラー:', err);
    return Response.json({ error: '登録に失敗しました' }, { status: 500 });
  } finally {
    if (client) {
      releaseClient(client); // 💡 最終的にクライアントを解放
    }
  }
}
