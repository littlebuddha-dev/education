import { query } from '@/lib/db';
import { verifyTokenFromHeader } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = verifyTokenFromHeader(req); // ← JWT検証
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

    const result = await query(
      `SELECT * FROM children WHERE user_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );

    return Response.json(result.rows);
  } catch (err) {
    console.error('子ども一覧取得エラー:', err);
    return Response.json({ error: err.message || '一覧取得失敗' }, { status: 500 });
  }
}