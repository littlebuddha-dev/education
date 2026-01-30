// /src/app/api/auth/refresh/route.js
// 役割: トークンリフレッシュAPI。
// 修正: レスポンスのuserオブジェクトをLogin APIと統一（キャメルケース）。

import { query } from '@/lib/db';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth';

export async function POST(req) {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return Response.json({ error: 'Refresh token not found' }, { status: 401 });
  }

  try {
    // DB内のリフレッシュトークンを確認
    const tokenResult = await query(
      `SELECT * FROM refresh_tokens WHERE token = $1`,
      [refreshToken]
    );

    const storedToken = tokenResult.rows[0];

    // トークンが存在しない、無効化されている、期限切れの場合
    if (!storedToken || storedToken.is_revoked || new Date() > new Date(storedToken.expires_at)) {
      return Response.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // トークンの署名検証
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded.id !== storedToken.user_id) {
      return Response.json({ error: 'Token payload does not match' }, { status: 401 });
    }

    // ユーザー情報を再取得（最新のロール情報などを反映するため）
    const userResult = await query(
      `SELECT id, email, first_name, last_name, role FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 401 });
    }
    const userFromDb = userResult.rows[0];

    // 新しいアクセストークンを生成（auth.js内でキャメルケースに変換される）
    const newAccessToken = generateAccessToken(userFromDb);

    return Response.json({
      accessToken: newAccessToken,
      user: {
        id: userFromDb.id,
        email: userFromDb.email,
        firstName: userFromDb.first_name, // DBのスネークケースをキャメルケースに変換
        lastName: userFromDb.last_name,
        role: userFromDb.role,
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error.message);
    // クライアント側でログアウト処理等をトリガーさせるため、明確に401を返す
    return Response.json({ error: 'Failed to refresh token' }, { status: 401 });
  }
}