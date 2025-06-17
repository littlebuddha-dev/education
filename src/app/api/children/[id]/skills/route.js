// src/app/api/children/[id]/skills/route.js
// タイトル: 子どものスキルログ取得API
// 役割: 特定の子どものスキルログ一覧を取得します。認証と認可処理を追加し、関係者（本人、保護者、管理者）のみが閲覧できるように修正しました。

import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth'; // [追加] 認証ライブラリをインポート

export async function GET(req, { params }) { // [修正] req を受け取るように変更
  const childId = params.id;

  try {
    // [追加] 認証: リクエストからユーザー情報を取得
    const currentUser = verifyTokenFromCookie(req);

    if (!childId || childId.toLowerCase() === 'undefined' || childId.trim() === '') {
      return Response.json({ error: '子どもIDが指定されていません。' }, { status: 400 });
    }
    if (!/^[0-9a-fA-F-]{36}$/.test(childId)) {
      return Response.json({ error: '不正なID形式です。' }, { status: 400 });
    }

    // [追加] 認可: ユーザーがこの情報にアクセスする権限があるか確認
    const childCheckRes = await query(
      `SELECT user_id, child_user_id FROM children WHERE id = $1`,
      [childId]
    );

    if (childCheckRes.rows.length === 0) {
      return Response.json({ error: '対象の子どもが見つかりません。' }, { status: 404 });
    }
    const childData = childCheckRes.rows[0];

    const isOwner = currentUser.id === childData.user_id;
    const isSelf = currentUser.id === childData.child_user_id;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isSelf && !isAdmin) {
      return Response.json({ error: 'アクセス権限がありません。' }, { status: 403 });
    }

    // 認可が通れば、スキルログを取得
    const result = await query(
      `SELECT id, domain, score, recorded_at
       FROM skill_logs
       WHERE child_id = $1
       ORDER BY recorded_at DESC`,
      [childId]
    );
    return Response.json(result.rows);

  } catch (err) {
    console.error(`スキル取得エラー (childId: ${childId}):`, err);
    // JWTの検証エラーなどもここでキャッチ
    if (err.message.includes('トークン')) {
      return Response.json({ error: err.message }, { status: 401 });
    }
    if (err.message && err.message.includes('invalid input syntax for type uuid')) {
        return Response.json({ error: '不正なID形式でクエリが実行されようとしました。' }, { status: 400 });
    }
    return Response.json({ error: 'スキルログの取得に失敗しました。' }, { status: 500 });
  }
}