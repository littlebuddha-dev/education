// src/app/api/children/route.js
// 役割: 子どもの登録(POST)と一覧取得(GET) API
// 修正: フロントエンドからのパラメータ名(name/displayName)の揺らぎを吸収し、バリデーションエラーを解消

import { getClient, beginTransaction, commitTransaction, rollbackTransaction, releaseClient, query } from '@/lib/db';
import { verifyAccessTokenFromHeader } from '@/lib/auth';
import { createUser } from '@/repositories/userRepository';
import { createChildProfile, createParentChildRelationship } from '@/repositories/childRepository';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// [POST] 新しい子どもを登録する
export async function POST(req) {
  const client = await getClient();
  try {
    const parentUser = verifyAccessTokenFromHeader(req);

    if (parentUser.role !== 'parent') {
      return Response.json({ error: '保護者のみ操作可能です' }, { status: 403 });
    }

    const body = await req.json();
    
    // デバッグ用ログ: フロントエンドから何が送られてきているか確認
    console.log('[API/children] Received body:', body);

    // ✅ 修正ポイント: パラメータの揺らぎを吸収 (name, displayName, display_name いずれも許容)
    // フロントエンドがどのキーで送ってきても対応できるようにする
    const name = body.name || body.displayName || body.display_name;
    const gender = body.gender;
    const birthday = body.birthday;

    // バリデーション
    if (!name || !gender || !birthday) {
      console.error('[API/children] Validation Error:', { name, gender, birthday });
      return Response.json({ 
        error: '名前、性別、誕生日は必須です。',
        received: { name, gender, birthday } 
      }, { status: 400 });
    }
    
    await beginTransaction(client);

    // --- 1. 子ども用のユーザーアカウントを自動生成 ---
    // メールアドレスはユニークである必要があるためUUIDを使用
    const childEmail = `${uuidv4()}@placeholder.com`;
    // パスワードは仮のもの（ログインには使わない前提だがDB制約のため必要）
    const tempPassword = uuidv4(); 
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const childUser = await createUser(client, {
      email: childEmail,
      password_hash: passwordHash,
      role: 'child',
      first_name: name, // ユーザーテーブルのfirst_nameにも入れておく
      last_name: ''     // last_nameは空でも許容する設計とする
    });

    // --- 2. 子どもプロフィール作成 ---
    // childrenテーブルの display_name にマッピング
    const childProfile = await createChildProfile(client, {
      user_id: childUser.id,
      display_name: name, // display_nameとして保存
      gender: gender,
      birthday: birthday
    });

    // --- 3. 親子関係の作成 (parent_child_relationships) ---
    await createParentChildRelationship(client, {
      parent_user_id: parentUser.id,
      child_user_id: childUser.id,
      relationship_type: 'parent', // デフォルト値
      status: 'active'
    });

    await commitTransaction(client);

    return Response.json({
      message: '子どもの登録が完了しました',
      child: {
        id: childProfile.id,
        userId: childUser.id,
        displayName: childProfile.display_name
      }
    }, { status: 201 });

  } catch (error) {
    await rollbackTransaction(client);
    console.error('Child registration error:', error);
    return Response.json({ error: '登録処理中にエラーが発生しました: ' + error.message }, { status: 500 });
  } finally {
    releaseClient(client);
  }
}

// [GET] 子ども一覧を取得する
export async function GET(req) {
  try {
    const user = verifyAccessTokenFromHeader(req);
    let queryText = '';
    let queryParams = [user.id];

    if (user.role === 'parent') {
      // 親の場合、紐づいている子ども一覧を取得（parent_child_relationships経由）
      queryText = `
        SELECT 
          c.id, 
          c.user_id, 
          c.display_name, 
          c.birthday, 
          c.gender, 
          c.created_at, 
          c.updated_at
        FROM children c
        JOIN parent_child_relationships pcr ON c.user_id = pcr.child_user_id
        WHERE pcr.parent_user_id = $1 AND pcr.status = 'active'
        ORDER BY c.display_name;
      `;
    } else if (user.role === 'child') {
      // 子どもの場合、自分自身のプロフィールを取得
      queryText = `
        SELECT id, user_id, display_name, birthday, gender, created_at, updated_at
        FROM children
        WHERE user_id = $1;
      `;
    } else if (user.role === 'admin') {
      // 管理者の場合、すべての子ども一覧を取得（親の情報もJOINして取得）
      queryText = `
        SELECT 
          c.id, 
          c.user_id, 
          c.display_name, 
          c.birthday, 
          c.gender, 
          pcr.parent_user_id,
          parent.email as parent_email
        FROM children c
        LEFT JOIN parent_child_relationships pcr ON c.user_id = pcr.child_user_id AND pcr.status = 'active'
        LEFT JOIN users parent ON pcr.parent_user_id = parent.id
        ORDER BY c.created_at DESC;
      `;
      queryParams = [];
    } else {
      return Response.json({ error: '権限がありません' }, { status: 403 });
    }
    
    const result = await query(queryText, queryParams);
    
    // フロントエンドで扱いやすい形式（キャメルケース）に変換して返す
    const formattedRows = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      birthday: row.birthday,
      gender: row.gender,
      createdAt: row.created_at,
      parentEmail: row.parent_email // admin用
    }));

    return Response.json(formattedRows);

  } catch (error) {
    console.error('Fetch children error:', error);
    return Response.json({ error: 'データ取得中にエラーが発生しました' }, { status: 500 });
  }
}