// /src/app/api/admin/users/[id]/skills/route.js
// 役割: 管理者が特定のユーザーのスキル統計を取得するAPI

import { query } from '@/lib/db';
// ✅【修正】正しい認証関数 verifyAccessTokenFromHeader をインポートします
import { verifyAccessTokenFromHeader } from '@/lib/auth'; 

export async function GET(req, { params }) {
  try {
    // ✅【修正】ヘッダーのアクセストークンを検証します
    const user = verifyAccessTokenFromHeader(req);
    
    // 管理者権限をチェック
    if (user.role !== 'admin') {
      return Response.json({ error: '管理者のみがアクセスできます' }, { status: 403 });
    }

    const targetUserId = params.id;

    // UUID形式を検証
    if (!/^[0-9a-fA-F-]{36}$/.test(targetUserId)) {
      return Response.json({ error: '不正なユーザーID形式です' }, { status: 400 });
    }

    // ユーザーの子どもに関連するスキルログを集計
    const result = await query(`
      SELECT
        c.id AS child_id,
        c.name AS child_name,
        s.domain,
        ROUND(AVG(s.score)::numeric, 1) AS avg_score,
        COUNT(*) AS entry_count,
        MAX(s.recorded_at) AS last_recorded
      FROM children c
      JOIN skill_logs s ON s.child_id = c.id
      WHERE c.user_id = $1 OR c.child_user_id = $1
      GROUP BY c.id, c.name, s.domain
      ORDER BY c.name, s.domain
    `, [targetUserId]);

    return Response.json(result.rows);
  } catch (err) {
    // 認証エラーのハンドリング
    if (err.message.includes('token') || err.message.includes('Authorization')) {
        return Response.json({ error: `認証エラー: ${err.message}` }, { status: 401 });
    }
    console.error('スキル統計取得エラー:', err);
    return Response.json({ error: '統計データの取得に失敗しました' }, { status: 500 });
  }
}