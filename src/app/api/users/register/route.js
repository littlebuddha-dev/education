import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  try {
    const { email, password, first_name, last_name, role } = await req.json();

    // 既存メール確認
    const exists = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return Response.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10); // cost factor 10

    // 登録
    await query(
      `INSERT INTO users (email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, hashedPassword, first_name, last_name, role || 'parent']
    );

    return Response.json({ message: '登録完了' });
  } catch (err) {
    console.error('登録エラー:', err);
    return Response.json({ error: '登録に失敗しました' }, { status: 500 });
  }
}
