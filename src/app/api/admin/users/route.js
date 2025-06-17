// src/app/api/admin/users/route.js
// 修正版：詳細ログ付きで認証問題を診断
import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth';

export async function GET(req) {
  console.log('🚀 管理者ユーザーAPI開始');
  console.log('📍 リクエストURL:', req.url);
  console.log('🔗 リクエストヘッダー:', Object.fromEntries(req.headers.entries()));
  
  try {
    // 詳細な認証ログ付きでユーザー認証
    console.log('🔐 認証プロセス開始...');
    
    let user;
    try {
      user = verifyTokenFromCookie(req);
      console.log('✅ 認証成功:', {
        id: user.id,
        email: user.email,
        role: user.role
      });
    } catch (authError) {
      console.error('❌ 認証失敗:', authError.message);
      console.log('🔍 認証デバッグ情報:', {
        cookieHeader: req.headers.get('cookie'),
        authHeader: req.headers.get('authorization'),
        setCookieHeader: req.headers.get('set-cookie'),
        userAgent: req.headers.get('user-agent'),
        origin: req.headers.get('origin'),
        referer: req.headers.get('referer')
      });
      
      return Response.json({ 
        error: '認証が必要です。再ログインしてください。',
        debug: authError.message 
      }, { status: 401 });
    }

    // 管理者権限チェック
    if (user.role !== 'admin') {
      console.error('❌ 権限不足:', `必要: admin, 実際: ${user.role}`);
      return Response.json({ 
        error: '管理者権限が必要です。',
        currentRole: user.role 
      }, { status: 403 });
    }

    console.log('📊 データベースクエリ実行中...');
    
    // ユーザー一覧取得（子ども情報付き）
    const sqlQuery = `
      WITH user_children AS (
        SELECT
          c.user_id AS owner_user_id,
          c.id AS child_id,
          c.name AS child_name
        FROM children c
        WHERE c.user_id IS NOT NULL
        UNION ALL
        SELECT
          c.child_user_id AS owner_user_id,
          c.id AS child_id,
          c.name AS child_name
        FROM children c
        WHERE c.child_user_id IS NOT NULL
      ),
      user_aggregates AS (
        SELECT
          uc.owner_user_id,
          COUNT(uc.child_id) AS children_count,
          JSON_AGG(json_build_object('id', uc.child_id, 'name', uc.child_name)) AS children
        FROM user_children uc
        GROUP BY uc.owner_user_id
      )
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

    const result = await query(sqlQuery);
    console.log('📊 データベースクエリ成功:', `${result.rows.length}件のユーザー取得`);

    const response = Response.json(result.rows);
    
    // レスポンスヘッダーにデバッグ情報を追加（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-Auth-User', user.email);
      response.headers.set('X-Auth-Role', user.role);
      response.headers.set('X-Debug-Timestamp', new Date().toISOString());
    }
    
    console.log('✅ API処理完了');
    return response;

  } catch (dbError) {
    console.error('💥 データベースエラー:', dbError);
    console.log('🔍 エラー詳細:', {
      code: dbError.code,
      message: dbError.message,
      stack: dbError.stack?.split('\n')[0]
    });

    return Response.json({ 
      error: 'データベースエラーが発生しました。',
      debug: process.env.NODE_ENV === 'development' ? dbError.message : undefined
    }, { status: 500 });
  }
}

// DELETEメソッドも同様に修正
export async function DELETE(req) {
  console.log('🗑️ ユーザー削除API開始');
  
  try {
    const user = verifyTokenFromCookie(req);
    console.log('✅ 削除権限確認済み:', user.email);

    if (user.role !== 'admin') {
      return Response.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userIdToDelete = pathSegments[pathSegments.length - 1];

    if (!userIdToDelete) {
      return Response.json({ error: '削除対象のユーザーIDが指定されていません' }, { status: 400 });
    }

    console.log('🗑️ 削除対象ユーザーID:', userIdToDelete);

    // 自分自身の削除を防止
    if (user.id === userIdToDelete) {
      return Response.json({ error: '自分自身は削除できません' }, { status: 400 });
    }

    await query(`DELETE FROM users WHERE id = $1`, [userIdToDelete]);
    console.log('✅ ユーザー削除完了');

    return Response.json({ success: true, deletedUserId: userIdToDelete });

  } catch (error) {
    console.error('❌ ユーザー削除エラー:', error);
    return Response.json({ 
      error: '削除に失敗しました',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}