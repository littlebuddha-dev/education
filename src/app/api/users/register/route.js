// littlebuddha-dev/education/education-main/src/app/api/users/register/route.js
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  const client = await query('BEGIN'); // ✅ トランザクション開始

  try {
    // リクエストボディから birthday を取得
    const { email, password, first_name, last_name, role, birthday } = await req.json(); // 💡 修正: birthday を追加

    // 既存メール確認
    const exists = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      await query('ROLLBACK'); // ✅ ロールバック
      return Response.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10); // cost factor 10

    // ユーザー登録 (birthday カラムへの挿入を追加)
    const userResult = await query( // ✅ 登録されたユーザーのIDを取得するため RETURNING id を追加
      `INSERT INTO users (email, password_hash, first_name, last_name, role, birthday) // 💡 修正: birthday カラムを追加
       VALUES ($1, $2, $3, $4, $5, $6) // 💡 修正: $6 を追加
       RETURNING id, role`, // ✅ role も取得
      [email, hashedPassword, first_name, last_name, role || 'parent', birthday] // 💡 修正: birthday を追加
    );

    const newUser = userResult.rows[0];

    // ロールが 'child' の場合、children テーブルに自身の情報を登録
    // children テーブルの name が users の first_name と last_name を結合したものなので、birthday は children テーブルにも渡す
    if (newUser.role === 'child') {
      const childName = `${last_name || ''} ${first_name || ''}`.trim();
      if (!childName) {
        await query('ROLLBACK'); // ✅ ロールバック
        return Response.json({ error: '子どもの名前を入力してください' }, { status: 400 });
      }
      await query(
        `INSERT INTO children (child_user_id, name, birthday) // 💡 修正: birthday カラムを追加
         VALUES ($1, $2, $3)`, // user_id はNULL、child_user_id を自身のユーザーIDに
        [newUser.id, childName, birthday] // 💡 修正: birthday を追加
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
