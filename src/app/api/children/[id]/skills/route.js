import { query } from '@/lib/db';

export async function GET(_, { params }) {
  const childId = params.id;

  // UUID形式でない文字列を弾く（安全策）
  if (!/^[0-9a-fA-F-]{36}$/.test(childId)) {
    return Response.json({ error: '不正なIDです' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT id, domain, score, recorded_at
       FROM skill_logs
       WHERE child_id = $1
       ORDER BY recorded_at DESC`,
      [childId]
    );

    return Response.json(result.rows);
  } catch (err) {
    console.error('スキル取得エラー:', err);
    return Response.json({ error: '取得に失敗しました' }, { status: 500 });
  }
}
