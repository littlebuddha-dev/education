// littlebuddha-dev/education/education-main/src/app/api/users/register/route.js
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  const client = await query('BEGIN'); // ✅ トランザクション開始

  try {
    const { email, password, first_name, last_name, role } = await req.json();

    // 既存メール確認
    const exists = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      await query('ROLLBACK'); // ✅ ロールバック
      return Response.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10); // cost factor 10

    // ユーザー登録
    const userResult = await query( // ✅ 登録されたユーザーのIDを取得するため RETURNING id を追加
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, role`, // ✅ role も取得
      [email, hashedPassword, first_name, last_name, role || 'parent'] // role が指定されなければ parent
    );

    const newUser = userResult.rows[0];

    // ロールが 'child' の場合、children テーブルに自身の情報を登録
    if (newUser.role === 'child') {
      const childName = `${last_name || ''} ${first_name || ''}`.trim();
      if (!childName) {
        await query('ROLLBACK'); // ✅ ロールバック
        return Response.json({ error: '子どもの名前を入力してください' }, { status: 400 });
      }
      await query(
        `INSERT INTO children (child_user_id, name)
         VALUES ($1, $2)`, // user_id はNULL、child_user_id を自身のユーザーIDに
        [newUser.id, childName]
      );
    }

    await query('COMMIT'); // ✅ コミット
    return Response.json({ message: '登録完了' });
  } catch (err) {
    await query('ROLLBACK'); // ✅ ロールバック
    console.error('登録エラー:', err);
    return Response.json({ error: '登録に失敗しました' }, { status: 500 });
  }
}