import { query } from '@/lib/db';
import { verifyTokenFromHeader } from '@/lib/auth';

export async function GET(req, { params }) {
  const userId = params.id;

  try {
    const user = verifyTokenFromHeader(req);

    // ✅ 自分自身 or 管理者のみアクセス許可
    if (user.id !== userId && user.role !== 'admin') {
      return Response.json({ error: '閲覧権限がありません' }, { status: 403 });
    }

    // ✅ UUID形式チェック（セキュリティ対策）
    if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
      return Response.json({ error: '無効なユーザーID' }, { status: 400 });
    }

    const result = await query(`
      SELECT subject, domain, level, score, updated_at
      FROM skill_scores
      WHERE user_id = $1
      ORDER BY subject, domain
    `, [userId]);

    return Response.json(result.rows);
  } catch (err) {
    console.error('[スキル取得エラー]', err);
    return Response.json({ error: '取得失敗' }, { status: 500 });
  }
}
