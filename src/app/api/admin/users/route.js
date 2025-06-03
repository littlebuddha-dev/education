import { query } from '@/lib/db';
import { verifyTokenFromHeader } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = verifyTokenFromHeader(req);
    if (user.role !== 'admin') {
      return Response.json({ error: '管理者専用ページです' }, { status: 403 });
    }

    // ユーザーと子ども数をJOINで取得
    const result = await query(`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
        COUNT(c.id) AS children_count,
        JSON_AGG(
          CASE 
            WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'name', c.name)
          END
        ) FILTER (WHERE c.id IS NOT NULL) AS children
      FROM users u
      LEFT JOIN children c ON u.id = c.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return Response.json(result.rows);
  } catch (err) {
    console.error('管理者ユーザー一覧取得エラー:', err);
    return Response.json({ error: '一覧取得に失敗しました' }, { status: 500 });
  }
}
