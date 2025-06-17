// src/app/api/admin/users/route.js
// タイトル: 全ユーザー情報取得API（リファクタリング版）
// 役割: withAuthラッパーを使用し、管理者ロールのみが全ユーザー情報を取得できるようにします。
//       ユーザー情報には、関連する子どもの数と名前のリストが含まれます。

import { query } from '@/lib/db';
import { withAuth } from '@/lib/withAuth';

/**
 * 全ユーザーの情報を取得するハンドラ関数。
 * 認証と認可はwithAuthラッパーによって事前に処理されています。
 * @param {Request} req - Next.jsのRequestオブジェクト
 * @param {object} context - コンテキストオブジェクト
 * @param {object} context.user - 認証済みユーザーの情報
 * @returns {Response} ユーザーリストを含むJSONレスポンス
 */
async function getUsersHandler(req, { user }) {
  // Common Table Expression (CTE) を使用して、ユーザーに紐づく子どもを効率的に集計
  const sqlQuery = `
    WITH user_children AS (
      -- 保護者としての子どもを抽出
      SELECT
        c.user_id AS owner_user_id,
        c.id AS child_id,
        c.name AS child_name
      FROM children c
      WHERE c.user_id IS NOT NULL
      UNION ALL
      -- 子ども自身のアカウントに紐づくプロフィールを抽出
      SELECT
        c.child_user_id AS owner_user_id,
        c.id AS child_id,
        c.name AS child_name
      FROM children c
      WHERE c.child_user_id IS NOT NULL
    ),
    user_aggregates AS (
      -- ユーザーIDごとに子ども情報（数と名前のリスト）を集約
      SELECT
        uc.owner_user_id,
        COUNT(uc.child_id) AS children_count,
        JSON_AGG(json_build_object('id', uc.child_id, 'name', uc.child_name)) AS children
      FROM user_children uc
      GROUP BY uc.owner_user_id
    )
    -- usersテーブルと集約結果を結合して最終的なリストを生成
    SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      u.created_at,
      COALESCE(ua.children_count, 0)::integer AS children_count,
      COALESCE(ua.children, '[]'::json) AS children
    FROM users u
    LEFT JOIN user_aggregates ua ON u.id = ua.owner_user_id
    ORDER BY u.created_at DESC;
  `;

  try {
    const result = await query(sqlQuery);
    return Response.json(result.rows);
  } catch (dbError) {
    console.error('データベースクエリエラー (getUsersHandler):', dbError);
    return new Response(JSON.stringify({ error: 'ユーザー情報の取得に失敗しました。' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// withAuthでハンドラをラップし、許可するロールとして 'admin' を指定
export const GET = withAuth(getUsersHandler, { allowedRoles: ['admin'] });
