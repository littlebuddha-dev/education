// littlebuddha-dev/education/education-main/src/app/api/children/[id]/learning-progress/route.js
import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth';

export async function GET(req, { params }) {
  const childId = params.id;

  if (!childId || childId.toLowerCase() === 'undefined' || childId.trim() === '') {
    console.warn(`GET /api/children/[id]/learning-progress: childId is missing, 'undefined', or empty. Received: ${childId}`);
    return Response.json({ error: '子どもIDが指定されていません。' }, { status: 400 });
  }

  if (!/^[0-9a-fA-F-]{36}$/.test(childId)) {
    console.warn(`GET /api/children/[id]/learning-progress: Invalid UUID format for childId: ${childId}`);
    return Response.json({ error: '無効な子どもID形式です。' }, { status: 400 });
  }

  try {
    const user = verifyTokenFromCookie(req);

    const childCheck = await query(
      `SELECT user_id, child_user_id FROM children WHERE id = $1`,
      [childId]
    );

    if (childCheck.rows.length === 0) {
      return Response.json({ error: '子どもが見つかりません。' }, { status: 404 });
    }

    const foundChild = childCheck.rows[0];

    if (user.id !== foundChild.user_id && user.role !== 'admin' && user.id !== foundChild.child_user_id) {
      return Response.json({ error: '閲覧権限がありません。' }, { status: 403 });
    }
    
    console.log(`Executing query for GET /api/children/${childId}/learning-progress`);
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
    console.error(`学習進捗取得エラー (childId: ${childId}):`, err);
    if (err.message && err.message.includes('invalid input syntax for type uuid')) {
        return Response.json({ error: '不正なID形式でクエリが実行されようとしました。' }, { status: 400 });
    }
    return Response.json({ error: '学習進捗の取得に失敗しました。' }, { status: 500 });
  }
}
