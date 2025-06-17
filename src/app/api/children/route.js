// littlebuddha-dev/education/education-main/src/app/api/children/route.js
import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth';

export async function POST(req) {
  const user = verifyTokenFromCookie(req);
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

  try {
    const result = await query(
      `INSERT INTO children (user_id, name, gender, birthday)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, name.trim(), gender, birthday]
    );
    return Response.json(result.rows[0]);
  } catch (err) {
    console.error('子ども登録エラー:', err);
    if (err.code === '23503') {
        return Response.json({ error: '指定されたユーザーが見つかりません。' }, { status: 400 });
    }
    return Response.json({ error: '子どもの登録に失敗しました。' }, { status: 500 });
  }
}


export async function GET(req) {
  try {
    const user = verifyTokenFromCookie(req);

    const { searchParams } = new URL(req.url);
    const childIdParam = searchParams.get('id');
    const childUserIdParam = searchParams.get('child_user_id');

    let queryText = `SELECT id, user_id, name, birthday, gender, created_at, updated_at, child_user_id FROM children WHERE 1 = 1`; // 明示的にカラムを指定
    const queryParams = [];
    let paramIndex = 1;

    if (user.role === 'parent') {
      queryText += ` AND (user_id = $${paramIndex++} OR user_id IS NULL)`; // 自身の子ども、または紐づけられていない子ども
      queryParams.push(user.id);
    } else if (user.role === 'child') {
      queryText += ` AND child_user_id = $${paramIndex++}`; // 自身の子どもプロフィール
      queryParams.push(user.id);
    } else if (user.role !== 'admin') {
        return Response.json({ error: '閲覧権限がありません' }, { status: 403 });
    }
    // 管理者はフィルターなし

    if (childIdParam && childIdParam.toLowerCase() !== 'undefined' && childIdParam.trim() !== '') {
      if (!/^[0-9a-fA-F-]{36}$/.test(childIdParam)) {
        console.warn(`GET /api/children: Invalid UUID format for id: ${childIdParam}`);
        return Response.json({ error: '不正なID形式です(id)。' }, { status: 400 });
      }
      queryText += ` AND id = $${paramIndex++}`;
      queryParams.push(childIdParam);
    } else if (childIdParam && (childIdParam.toLowerCase() === 'undefined' || childIdParam.trim() === '')) {
        console.warn(`GET /api/children: Received 'undefined' or empty string for id parameter.`);
        return Response.json([]); // "undefined" や空文字列の場合は該当なし
    }

    if (childUserIdParam && childUserIdParam.toLowerCase() !== 'undefined' && childUserIdParam.trim() !== '') {
      if (!/^[0-9a-fA-F-]{36}$/.test(childUserIdParam)) {
        console.warn(`GET /api/children: Invalid UUID format for child_user_id: ${childUserIdParam}`);
        return Response.json({ error: '不正なID形式です(child_user_id)。' }, { status: 400 });
      }
      queryText += ` AND child_user_id = $${paramIndex++}`;
      queryParams.push(childUserIdParam);
    } else if (childUserIdParam && (childUserIdParam.toLowerCase() === 'undefined' || childUserIdParam.trim() === '')) {
        console.warn(`GET /api/children: Received 'undefined' or empty string for child_user_id parameter.`);
        return Response.json([]); // "undefined" や空文字列の場合は該当なし
    }

    queryText += ` ORDER BY created_at DESC`;
    console.log(`Executing query for GET /api/children: ${queryText}`, queryParams);
    const result = await query(queryText, queryParams);

    return Response.json(result.rows);
  } catch (err) {
    console.error('子ども一覧/詳細取得エラー API:', err);
    if (err.message && err.message.includes('invalid input syntax for type uuid')) {
        return Response.json({ error: '不正なID形式でクエリが実行されようとしました。' }, { status: 400 });
    }
    return Response.json({ error: err.message || '一覧/詳細取得失敗' }, { status: 500 });
  }
}