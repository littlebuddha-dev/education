// /src/app/api/children/route.js
// 役割: 子どもの登録(POST)と一覧取得(GET) API。認証方式を刷新。
// 🔧 完全修正: クエリ構築ロジックを根本的に修正

import { query } from '@/lib/db';
import { verifyAccessTokenFromHeader } from '@/lib/auth';

// [POST] 新しい子どもを登録する
export async function POST(req) {
  try {
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
    if (err.code === '23503') {
        return Response.json({ error: '指定されたユーザーが見つかりません。' }, { status: 400 });
    }
    return Response.json({ error: '子どもの登録に失敗しました。' }, { status: 500 });
  }
}

// [GET] 子どもの一覧または詳細を取得する
export async function GET(req) {
  try {
    const user = verifyAccessTokenFromHeader(req);

    const { searchParams } = new URL(req.url);
    const childIdParam = searchParams.get('id');
    const childUserIdParam = searchParams.get('child_user_id');

    console.log('[Children API] Query params:', { 
      childIdParam, 
      childUserIdParam, 
      userRole: user.role, 
      userId: user.id 
    });

    // 🔧 完全修正: クエリとパラメータを分離して構築
    let baseQuery = `SELECT id, user_id, name, birthday, gender, created_at, updated_at, child_user_id FROM children`;
    let whereConditions = [];
    let queryParams = [];

    // ロールに応じた基本フィルタリング
    if (user.role === 'parent') {
      whereConditions.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(user.id);
    } else if (user.role === 'child') {
      whereConditions.push(`child_user_id = $${queryParams.length + 1}`);
      queryParams.push(user.id);
    } else if (user.role !== 'admin') {
      return Response.json({ error: '閲覧権限がありません' }, { status: 403 });
    }

    // 追加フィルタリング
    if (childIdParam) {
      whereConditions.push(`id = $${queryParams.length + 1}`);
      queryParams.push(childIdParam);
    }

    // child_user_id パラメータ（子どもロール以外の場合のみ）
    if (childUserIdParam && user.role !== 'child') {
      whereConditions.push(`child_user_id = $${queryParams.length + 1}`);
      queryParams.push(childUserIdParam);
    }

    // 最終的なクエリを構築
    const finalQuery = whereConditions.length > 0 
      ? `${baseQuery} WHERE ${whereConditions.join(' AND ')} ORDER BY created_at DESC`
      : `${baseQuery} ORDER BY created_at DESC`;
    
    console.log('[Children API] Final query:', { 
      query: finalQuery, 
      params: queryParams 
    });

    const result = await query(finalQuery, queryParams);

    console.log('[Children API] Query result:', { rowCount: result.rows.length });
    return Response.json(result.rows);

  } catch (err) {
    if (err.message.includes('token') || err.message.includes('Authorization')) {
        return Response.json({ error: `認証エラー: ${err.message}` }, { status: 401 });
    }
    console.error('子ども一覧/詳細取得エラー API:', err);
    return Response.json({ error: '一覧/詳細取得に失敗しました' }, { status: 500 });
  }
}