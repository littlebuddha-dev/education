// littlebuddha-dev/education/education-main/src/app/api/admin/users/[id]/skills/route.js
import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth'; // 修正: verifyTokenFromHeader を verifyTokenFromCookie に変更

export async function GET(req, { params }) {
  try {
    const user = verifyTokenFromCookie(req); // 修正: verifyTokenFromHeader を verifyTokenFromCookie に変更
    if (user.role !== 'admin') {
      return Response.json({ error: '管理者のみがアクセスできます' }, { status: 403 });
    }

    const targetUserId = params.id; // ここで params.id は、親のユーザーID、または独立した子どものユーザーIDになりうる

    // UUID検証（最低限）
    if (!/^[0-9a-fA-F-]{36}$/.test(targetUserId)) {
      return Response.json({ error: '不正なユーザーID' }, { status: 400 });
    }

    const result = await query(`
      SELECT
        c.id AS child_id,
        c.name AS child_name,
        s.domain,
        ROUND(AVG(s.score)::numeric, 1) AS avg_score,
        COUNT(*) AS entry_count,
        MAX(s.recorded_at) AS last_recorded
      FROM children c
      JOIN skill_logs s ON s.child_id = c.id
      WHERE c.user_id = $1 OR c.child_user_id = $1 -- ✅ 修正: user_id または child_user_id でフィルタリング
      GROUP BY c.id, c.name, s.domain
      ORDER BY c.name, s.domain
    `, [targetUserId]);

    return Response.json(result.rows);
  } catch (err) {
    console.error('統計取得エラー:', err);
    return Response.json({ error: '統計データ取得に失敗しました' }, { status: 500 });
  }
}