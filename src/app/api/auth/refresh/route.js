// /src/app/api/auth/refresh/route.js
// 役割: トークンリフレッシュAPI（最終版）。デバッグ用ログを削除。

import { query } from '@/lib/db';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth';

export async function POST(req) {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return Response.json({ error: 'Refresh token not found' }, { status: 401 });
  }

  try {
    const tokenResult = await query(
      `SELECT * FROM refresh_tokens WHERE token = $1`,
      [refreshToken]
    );

    const storedToken = tokenResult.rows[0];

    if (!storedToken || storedToken.is_revoked || new Date() > new Date(storedToken.expires_at)) {
      return Response.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (decoded.id !== storedToken.user_id) {
      return Response.json({ error: 'Token payload does not match' }, { status: 401 });
    }

    const userResult = await query(
      `SELECT id, email, first_name, last_name, role FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 401 });
    }
    const userFromDb = userResult.rows[0];

    const newAccessToken = generateAccessToken(userFromDb);

    return Response.json({
      accessToken: newAccessToken,
      user: {
        id: userFromDb.id,
        email: userFromDb.email,
        firstName: userFromDb.first_name,
        lastName: userFromDb.last_name,
        role: userFromDb.role,
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error.message);
    if (error.message.includes('token')) {
        return Response.json({ error: error.message }, { status: 401 });
    }
    return Response.json({ error: 'Failed to refresh token due to a server error.' }, { status: 500 });
  }
}