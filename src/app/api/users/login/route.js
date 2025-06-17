// 1. src/app/api/users/login/route.js を修正
// ログインAPI側でのCookie設定を修正

import { query } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      console.log(`ログイン失敗: ユーザーが見つかりません (${email})`);
      return Response.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`ログイン失敗: パスワードが一致しません (${email})`);
      return Response.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };

    const token = generateToken(tokenPayload);
    console.log(`ログイン成功: ${user.email} (${user.role})`);

    // 🔧 修正：Cookie設定を確実にする
    const response = Response.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      }
    });

    // 🚨 重要：HttpOnly=false に設定（クライアントサイドでアクセス可能にする）
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `token=${token}`,
      'Path=/',
      'Max-Age=604800', // 7日間
      'SameSite=Lax',
      'HttpOnly=false', // 🔧 修正：クライアントサイドでアクセス可能
    ];

    // 開発環境ではSecureフラグを外す
    if (isProduction) {
      cookieOptions.push('Secure');
    }

    response.headers.set('Set-Cookie', cookieOptions.join('; '));
    console.log('🍪 Set-Cookie ヘッダー:', cookieOptions.join('; '));

    return response;

  } catch (error) {
    console.error('ログインAPIエラー:', error);
    return Response.json(
      { error: 'ログイン処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}