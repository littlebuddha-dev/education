// /src/app/api/users/login/route.js
// 役割: ログイン処理を行い、アクセストークンとリフレッシュトークンを発行する。

import { query } from '@/lib/db';
import { generateAccessToken, generateRefreshToken, generateJti } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { serialize } from 'cookie';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 });
    }

    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    if (result.rows.length === 0) {
      return Response.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 });
    }

    const userFromDb = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, userFromDb.password_hash);
    if (!isPasswordValid) {
      return Response.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 });
    }

    const jti = generateJti();
    const accessToken = generateAccessToken(userFromDb);
    const refreshToken = generateRefreshToken(userFromDb, jti);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日後

    await query(
      `INSERT INTO refresh_tokens (jti, user_id, token, expires_at) VALUES ($1, $2, $3, $4)`,
      [jti, userFromDb.id, refreshToken, expiresAt]
    );

    const refreshTokenCookie = serialize('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // ✅【修正】'strict' から 'lax' に変更
      path: '/',
      expires: expiresAt,
    });

    const body = JSON.stringify({
      accessToken,
      user: { // ✅【修正】フロントエンド用にcamelCaseに統一
        id: userFromDb.id,
        email: userFromDb.email,
        firstName: userFromDb.first_name,
        lastName: userFromDb.last_name,
        role: userFromDb.role,
      }
    });
    
    // ✅【修正】レスポンスの生成方法をより明示的なものに変更
    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': refreshTokenCookie,
        },
    });

  } catch (error) {
    console.error('Login API error:', error);
    return Response.json({ error: 'ログイン処理中にエラーが発生しました' }, { status: 500 });
  }
}