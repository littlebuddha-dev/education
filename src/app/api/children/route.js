// src/app/api/children/route.js
import { query } from '@/lib/db';
import { verifyTokenFromHeader } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = verifyTokenFromHeader(req); // JWT検証
    if (user.role !== 'parent') {
      return Response.json({ error: 'この操作は保護者のみ可能です' }, { status: 403 });
    }

    const { name, birthday, gender } = await req.json();

    const result = await query(
      `INSERT INTO children (user_id, name, birthday, gender)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, name, birthday, gender]
    );

    return Response.json(result.rows[0]);
  } catch (err) {
    console.error('登録エラー:', err);
    return Response.json({ error: err.message || '登録失敗' }, { status: 500 });
  }
}


export async function GET(req) {
  try {
    const user = verifyTokenFromHeader(req); // JWTからユーザー情報取得

    // 親のみ子ども一覧を取得可能にする
    if (user.role !== 'parent') {
      return Response.json({ error: '閲覧権限がありません' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('id'); // ✅ IDパラメータを取得

    let queryText = `SELECT * FROM children WHERE user_id = $1`;
    const queryParams = [user.id];

    if (childId) { // ✅ childId があればフィルタリングを追加
      queryText += ` AND id = $2`;
      queryParams.push(childId);
    }

    queryText += ` ORDER BY created_at DESC`; // ソート順は常に適用

    const result = await query(queryText, queryParams); // ✅ パラメータも動的に変更

    return Response.json(result.rows);
  } catch (err) {
    console.error('子ども一覧取得エラー:', err);
    return Response.json({ error: err.message || '一覧取得失敗' }, { status: 500 });
  }
}
