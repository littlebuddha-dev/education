// littlebuddha-dev/education/education-main/src/app/api/children/[id]/learning-progress/route.js
import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth'; // 修正: verifyTokenFromHeader を verifyTokenFromCookie に変更

export async function GET(req, { params }) {
  const childId = params.id;

  try {
    const user = verifyTokenFromCookie(req); // 修正: verifyTokenFromHeader を verifyTokenFromCookie に変更

    // 子どもが認証済みユーザーに紐づくか確認（保護者）
    const childCheck = await query(
      `SELECT user_id, child_user_id FROM children WHERE id = $1`, // ✅ child_user_id も取得
      [childId]
    );

    if (childCheck.rows.length === 0) {
      return Response.json({ error: '子どもが見つかりません' }, { status: 404 });
    }

    const foundChild = childCheck.rows[0]; // ✅ 変数名を変更

    // 自分自身の子どもの情報、または管理者のみアクセス許可
    // ✅ 修正: user.id が child_user_id と一致する場合も許可
    if (user.id !== foundChild.user_id && user.role !== 'admin' && user.id !== foundChild.child_user_id) {
      return Response.json({ error: '閲覧権限がありません' }, { status: 403 });
    }

    // UUID形式チェック
    if (!/^[0-9a-fA-F-]{36}$/.test(childId)) {
      return Response.json({ error: '無効な子どもID' }, { status: 400 });
    }

    // 子どもの学習進捗と学習目標情報をJOINして取得
    const result = await query(`
      SELECT
        clp.id,
        lg.name AS goal_name,
        lg.subject,
        lg.domain,
        clp.status,
        clp.last_accessed_at,
        clp.achieved_at,
        lg.description
      FROM child_learning_progress clp
      JOIN learning_goals lg ON clp.goal_id = lg.id
      WHERE clp.child_id = $1
      ORDER BY lg.subject, lg.domain
    `, [childId]);

    return Response.json(result.rows);
  } catch (err) {
    console.error('学習進捗取得エラー:', err);
    return Response.json({ error: '学習進捗の取得に失敗しました' }, { status: 500 });
  }
}
