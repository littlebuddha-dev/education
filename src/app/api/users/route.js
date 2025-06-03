// src/app/api/users/route.js
import { query } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') === 'asc' ? 'ASC' : 'DESC';
  const q = searchParams.get('query') || '';

  try {
    const result = await query(`
  SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
         COUNT(c.id) AS children_count,
         ARRAY_REMOVE(ARRAY_AGG(c.name), NULL) AS children_names
  FROM users u
  LEFT JOIN children c ON u.id = c.user_id
  GROUP BY u.id
  ORDER BY u.created_at DESC
`);
    return Response.json(result.rows);
  } catch (err) {
    console.error('取得失敗:', err);
    return Response.json({ error: '取得エラー' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { id } = await req.json();
  try {
    await query('DELETE FROM users WHERE id = $1', [id]);
    return Response.json({ success: true });
  } catch (err) {
    console.error('削除失敗:', err);
    return Response.json({ error: '削除エラー' }, { status: 500 });
  }
}