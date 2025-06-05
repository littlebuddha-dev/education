// littlebuddha-dev/education/education-main/src/app/api/users/register/route.js
import { query, getClient, beginTransaction, commitTransaction, rollbackTransaction, releaseClient } from '@/lib/db'; // 💡 インポート文にdb関連関数を追加
import bcrypt from 'bcrypt';

export async function POST(req) {
  const client = await getClient(); // getClient を使用してクライアントを取得

  try {
    await beginTransaction(client); // client を使用してトランザクション開始

    const { email, password, first_name, last_name, role, birthday } = await req.json();

    // 既存メール確認
    const existsResult = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existsResult.rows.length > 0) {
      await rollbackTransaction(client);
      // releaseClient(client); // 💡 finallyブロックで解放するため、ここでは不要
      return Response.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー登録
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, birthday)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, role`,
      [email, hashedPassword, first_name, last_name, role || 'parent', birthday]
    );

    const newUser = userResult.rows[0];

    // ロールが 'child' の場合、children テーブルに自身の情報を登録
    if (newUser.role === 'child') {
      const childName = `${last_name || ''} ${first_name || ''}`.trim();
      if (!childName) {
        await rollbackTransaction(client);
        // releaseClient(client); // 💡 finallyブロックで解放するため、ここでは不要
        return Response.json({ error: '子どもの名前を入力してください' }, { status: 400 });
      }
      await client.query(
        `INSERT INTO children (child_user_id, name, birthday)
         VALUES ($1, $2, $3)`,
        [newUser.id, childName, birthday]
      );
    }

    await commitTransaction(client);
    return Response.json({ message: '登録完了' });
  } catch (err) {
    // エラー発生時にもロールバックを試みる
    if (client) { // 💡 clientが取得できている場合のみロールバック
        try {
            await rollbackTransaction(client);
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
            // ロールバック自体に失敗した場合の処理をここに追加することもできる
        }
    }
    console.error('登録エラー:', err);
    return Response.json({ error: '登録に失敗しました' }, { status: 500 });
  } finally {
    // 成功・失敗にかかわらず、clientが取得されていれば解放する
    if (client) {
      releaseClient(client);
    }
  }
}
