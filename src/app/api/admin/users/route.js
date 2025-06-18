// /src/app/api/admin/users/route.js
// 役割: 管理者向けのユーザー一覧取得API。ヘッダーのアクセストークンで認証する。

import { query } from '@/lib/db';
import { verifyAccessTokenFromHeader } from '@/lib/auth'; // ✅ 変更

export async function GET(req) {
  try {
    // ✅ ヘッダーのアクセストークンを検証
    const user = verifyAccessTokenFromHeader(req);

    if (user.role !== 'admin') {
      return Response.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const result = await query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at, COUNT(c.id)::int AS children_count
      FROM users u
      LEFT JOIN children c ON u.id = c.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return Response.json(result.rows);
  } catch (err) {
    if (err.message.includes('token') || err.message.includes('Authorization')) {
        return Response.json({ error: `認証エラー: ${err.message}` }, { status: 401 });
    }
    console.error('ユーザー一覧取得エラー:', err);
    return Response.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
  }
}