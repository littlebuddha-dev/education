import { query } from '@/lib/db';
import { verifyTokenFromHeader } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = verifyTokenFromHeader(req);
    if (user.role !== 'parent') {
      return Response.json({ error: '保護者のみ操作可能です' }, { status: 403 });
    }

    const { childId, domain, score } = await req.json();

    const result = await query(`
      INSERT INTO skill_logs (child_id, domain, score)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [childId, domain, score]);

    return Response.json(result.rows[0]);
  } catch (err) {
    console.error('Skill log 登録エラー:', err);
    return Response.json({ error: '登録に失敗しました' }, { status: 500 });
  }
}
