import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: '認証失敗：ユーザーが見つかりません' }, { status: 401 });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return Response.json({ error: '認証失敗：パスワードが一致しません' }, { status: 401 });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return Response.json({ token });
  } catch (err) {
    console.error('ログインエラー:', err);
    return Response.json({ error: 'ログイン処理に失敗しました' }, { status: 500 });
  }
}
