// littlebuddha-dev/education/education-main/src/app/api/children/route.js
import { query } from '@/lib/db';
// import { verifyTokenFromHeader } from '@/lib/auth'; // ❌ 削除
import { verifyTokenFromCookie } from '@/lib/auth'; // ✅ Cookieから取得するように変更

export async function POST(req) {
  try {
    // const user = verifyTokenFromHeader(req); // ❌ 変更
    const user = verifyTokenFromCookie(req); // ✅ Cookieから取得
    // 保護者ロールのみ、user_id を指定して子どもを登録可能
    if (user.role !== 'parent') {
      return Response.json({ error: 'この操作は保護者のみ可能です' }, { status: 403 });
    }

    const { name, birthday, gender } = await req.json();

    // 保護者が子どもを登録する場合、child_user_id は NULL
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
    // const user = verifyTokenFromHeader(req); // ❌ 変更
    const user = verifyTokenFromCookie(req); // ✅ Cookieから取得

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('id'); // 単一の子ども取得用
    const childUserId = searchParams.get('child_user_id'); // ✅ 追加: child_user_id でフィルタリング

    let queryText = `SELECT * FROM children WHERE 1 = 1`; // 基本クエリ
    const queryParams = [];
    let paramIndex = 1;

    // ロールに応じたフィルタリング
    if (user.role === 'parent') {
      // 保護者の場合、自分の user_id に紐付く子ども、または紐付いていない子どもプロフィールも取得可能にする
      // 後から紐付けできるようにするため
      queryText += ` AND (user_id = $${paramIndex++} OR user_id IS NULL)`;
      queryParams.push(user.id);
    } else if (user.role === 'child') {
      // 子どもの場合、自身の child_user_id に紐付くプロフィールのみ取得
      queryText += ` AND child_user_id = $${paramIndex++}`;
      queryParams.push(user.id); // user.id が child_user_id と同じ
    } else if (user.role === 'admin') {
        // 管理者の場合は全ての children を見れる（今回は特に条件追加せず）
    } else {
        return Response.json({ error: '閲覧権限がありません' }, { status: 403 });
    }


    if (childId) { // 特定の children.id でフィルタリング
      queryText += ` AND id = $${paramIndex++}`;
      queryParams.push(childId);
    }

    if (childUserId) { // ✅ child_user_id でフィルタリング (child ロールの自身プロフィール取得用)
      queryText += ` AND child_user_id = $${paramIndex++}`;
      queryParams.push(childUserId);
    }


    queryText += ` ORDER BY created_at DESC`;

    const result = await query(queryText, queryParams);

    return Response.json(result.rows);
  } catch (err) {
    console.error('子ども一覧取得エラー:', err);
    return Response.json({ error: err.message || '一覧取得失敗' }, { status: 500 });
  }
}