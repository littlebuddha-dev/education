import { query } from '@/lib/db';

export async function GET(_, { params }) {
  const childId = params.id;

  // UUID形式かどうかチェック（安全対策）
  if (!/^[0-9a-fA-F-]{36}$/.test(childId)) {
    return Response.json({ error: '不正なID形式です' }, { status: 400 });
  }

  try {
    const result = await query(`
      SELECT subject, domain, level, reason, recommendation, created_at
      FROM evaluation_logs
      WHERE child_id = $1
      ORDER BY created_at DESC
    `, [childId]);

    return Response.json(result.rows);
  } catch (err) {
    console.error('評価ログ取得エラー:', err);
    return Response.json({ error: '評価取得に失敗しました' }, { status: 500 });
  }
}
