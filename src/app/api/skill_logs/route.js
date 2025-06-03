// src/app/api/skill_logs/route.js
import { query } from '@/lib/db';

export async function POST(req) {
  const { childId, sessionId, skillName, score, context } = await req.json();

  try {
    const result = await query(
      `INSERT INTO skill_logs (child_id, session_id, skill_name, score, context)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [childId, sessionId, skillName, score, context]
    );

    return Response.json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting skill log:', err);
    return Response.json({ error: 'スキルログ登録に失敗しました' }, { status: 500 });
  }
}
