// /src/app/api/skills/route.js
// 役割: 手動スキルログ登録API。認証方式を刷新。

import { query } from '@/lib/db';
import { verifyAccessTokenFromHeader } from '@/lib/auth'; // ✅ 修正

export async function POST(req) {
  try {
    const user = verifyAccessTokenFromHeader(req); // ✅ 修正
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
    if (err.message.includes('token') || err.message.includes('Authorization')) {
        return Response.json({ error: `認証エラー: ${err.message}` }, { status: 401 });
    }
    console.error('Skill log 登録エラー:', err);
    return Response.json({ error: '登録に失敗しました' }, { status: 500 });
  }
}