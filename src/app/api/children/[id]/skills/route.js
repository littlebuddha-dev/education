// src/app/api/children/[id]/skills/route.js
import { query } from '@/lib/db';
// import { verifyTokenFromCookie } from '@/lib/auth'; // このAPIは認証をかけていないが、必要に応じて追加

export async function GET(_, { params }) {
  const childId = params.id;

  if (!childId || childId.toLowerCase() === 'undefined' || childId.trim() === '') {
    console.warn(`GET /api/children/[id]/skills: childId is missing, 'undefined', or empty. Received: ${childId}`);
    return Response.json({ error: '子どもIDが指定されていません。' }, { status: 400 });
  }

  if (!/^[0-9a-fA-F-]{36}$/.test(childId)) {
    console.warn(`GET /api/children/[id]/skills: Invalid UUID format for childId: ${childId}`);
    return Response.json({ error: '不正なID形式です。' }, { status: 400 });
  }

  try {
    console.log(`Executing query for GET /api/children/${childId}/skills`);
    const result = await query(
      `SELECT id, domain, score, recorded_at
       FROM skill_logs
       WHERE child_id = $1
       ORDER BY recorded_at DESC`,
      [childId]
    );
    return Response.json(result.rows);
  } catch (err) {
    console.error(`スキル取得エラー (childId: ${childId}):`, err);
    // UUID構文エラーの場合もここでキャッチされる可能性がある
    if (err.message && err.message.includes('invalid input syntax for type uuid')) {
        return Response.json({ error: '不正なID形式でクエリが実行されようとしました。' }, { status: 400 });
    }
    return Response.json({ error: 'スキルログの取得に失敗しました。' }, { status: 500 });
  }
}
