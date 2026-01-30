// /src/app/api/admin/users/[id]/skills/route.js
// 役割: 管理者が特定のユーザーのスキル統計を取得するAPI（新スキーマ対応版）
// 修正: Next.js 15対応のため、paramsをawaitして取得するように変更

import { verifyAccessTokenFromHeader } from '@/lib/auth'; 
import { getSkillStatsByParentId } from '@/repositories/skillRepository';

export async function GET(req, { params }) {
  try {
    // 1. 認証チェック
    const adminUser = verifyAccessTokenFromHeader(req);
    
    if (adminUser.role !== 'admin') {
      return Response.json({ error: '管理者のみがアクセスできます' }, { status: 403 });
    }

    // 2. パラメータの取得 (Next.js 15+ 対応)
    // params は Promise なので await が必要です
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    // 3. バリデーション
    if (!/^[0-9a-fA-F-]{36}$/.test(targetUserId)) {
      return Response.json({ error: '不正なユーザーID形式です' }, { status: 400 });
    }

    // 4. データ取得
    const stats = await getSkillStatsByParentId(targetUserId);

    return Response.json(stats);

  } catch (err) {
    if (err.message.includes('token') || err.message.includes('Authorization')) {
        return Response.json({ error: `認証エラー: ${err.message}` }, { status: 401 });
    }
    console.error('スキル統計取得エラー:', err);
    return Response.json({ error: '統計データの取得に失敗しました' }, { status: 500 });
  }
}