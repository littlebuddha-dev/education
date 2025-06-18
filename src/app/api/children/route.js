// /src/app/api/children/route.js
// 役割: 子どもの登録(POST)と一覧取得(GET) API。認証方式を刷新。

import { query } from '@/lib/db';
// ✅【修正】正しい認証関数 verifyAccessTokenFromHeader をインポート
import { verifyAccessTokenFromHeader } from '@/lib/auth';

// [POST] 新しい子どもを登録する
export async function POST(req) {
  try {
    // ✅【修正】ヘッダーのアクセストークンで認証
    const user = verifyAccessTokenFromHeader(req);

    if (user.role !== 'parent') {
      return Response.json({ error: '保護者のみ操作可能です' }, { status: 403 });
    }
    const { name, gender, birthday } = await req.json();

    if (!name || !gender || !birthday) {
      return Response.json({ error: '名前、性別、誕生日は必須です。' }, { status: 400 });
    }
    if (name.trim().length === 0) {
      return Response.json({ error: '名前は必須です。' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO children (user_id, name, gender, birthday)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, name.trim(), gender, birthday]
    );
    return Response.json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('token') || err.message.includes('Authorization')) {
        return Response.json({ error: `認証エラー: ${err.message}` }, { status: 401 });
    }
    console.error('子ども登録エラー:', err);
    if (err.code === '23503') { // Foreign key violation
        return Response.json({ error: '指定されたユーザーが見つかりません。' }, { status: 400 });
    }
    return Response.json({ error: '子どもの登録に失敗しました。' }, { status: 500 });
  }
}

// [GET] 子どもの一覧または詳細を取得する
export async function GET(req) {
  try {
    // ✅【修正】ヘッダーのアクセストークンで認証
    const user = verifyAccessTokenFromHeader(req);

    const { searchParams } = new URL(req.url);
    const childIdParam = searchParams.get('id');
    const childUserIdParam = searchParams.get('child_user_id');

    let queryText = `SELECT id, user_id, name, birthday, gender, created_at, updated_at, child_user_id FROM children WHERE 1 = 1`;
    const queryParams = [];
    let paramIndex = 1;

    // ロールに応じてフィルタリング
    if (user.role === 'parent') {
      // 保護者の場合は、自身が親として登録した子どもを取得
      queryText += ` AND user_id = $${paramIndex++}`;
      queryParams.push(user.id);
    } else if (user.role === 'child') {
      // 子どもの場合は、自身のアカウントに紐づくプロフィールを取得
      queryText += ` AND child_user_id = $${paramIndex++}`;
      queryParams.push(user.id);
    } else if (user.role !== 'admin') {
      // 管理者以外の上記以外のロールは閲覧不可
      return Response.json({ error: '閲覧権限がありません' }, { status: 403 });
    }
    // 管理者の場合はフィルターなし（全件取得）

    // クエリパラメータによる追加フィルタリング
    if (childIdParam) {
      queryText += ` AND id = $${paramIndex++}`;
      queryParams.push(childIdParam);
    }

    if (childUserIdParam) {
      queryText += ` AND child_user_id = $${paramIndex++}`;
      queryParams.push(childUserIdParam);
    }

    queryText += ` ORDER BY created_at DESC`;
    
    const result = await query(queryText, queryParams);

    return Response.json(result.rows);
  } catch (err) {
    if (err.message.includes('token') || err.message.includes('Authorization')) {
        return Response.json({ error: `認証エラー: ${err.message}` }, { status: 401 });
    }
    console.error('子ども一覧/詳細取得エラー API:', err);
    return Response.json({ error: '一覧/詳細取得に失敗しました' }, { status: 500 });
  }
}