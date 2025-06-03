// src/app/api/users/update/route.js
import { query } from '@/lib/db';

export async function PATCH(req) {
  const { id, first_name, last_name, email } = await req.json();

  try {
    const result = await query(
      `UPDATE users
       SET first_name = $1, last_name = $2, email = $3
       WHERE id = $4
       RETURNING id, email, first_name, last_name`,
      [first_name, last_name, email, id]
    );
    return Response.json(result.rows[0]);
  } catch (err) {
    console.error('更新失敗:', err);
    return Response.json({ error: '更新エラー' }, { status: 500 });
  }
}
