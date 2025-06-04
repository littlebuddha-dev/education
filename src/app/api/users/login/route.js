// src/app/api/users/login/route.js
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// ⚠️ CRITICAL: auth.js と同じ値を使用
const JWT_SECRET = process.env.JWT_SECRET || 'secret'; // ✅ デフォルト値を 'secret' に統一

export async function POST(req) {
  try {
    console.log('🔐 ログインAPI JWT_SECRET:', JWT_SECRET); // ✅ デバッグ追加
    
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
      JWT_SECRET, // ✅ 統一されたJWT_SECRET使用
      { expiresIn: '7d' }
    );

    console.log('🔐 トークン生成成功:', token.substring(0, 20) + '...'); // ✅ デバッグ追加

    return Response.json({ token });
  } catch (err) {
    console.error('ログインエラー:', err);
    return Response.json({ error: 'ログイン処理に失敗しました' }, { status: 500 });
  }
}
