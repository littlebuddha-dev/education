// src/lib/withAuth.js
// タイトル: APIルート認証・認可ラッパー
// 役割: APIルートのハンドラ関数をラップし、リクエストヘッダーのCookieからJWTを検証します。
//       指定された役割（ロール）を持つユーザーのみがアクセスできるように認可チェックも行います。

import { verifyTokenFromCookie } from '@/lib/auth';

/**
 * APIルートハンドラを認証・認可でラップする高階関数。
 * @param {Function} handler - 実際のAPI処理を行うハンドラ関数。引数として (req, { user, params }) を受け取ります。
 * @param {object} [options] - オプション。
 * @param {string[]} [options.allowedRoles=[]] - このAPIへのアクセスを許可するユーザーロールの配列。空配列の場合は認証のみ行い、ロールチェックは行いません。
 * @returns {Function} Next.jsのAPIルートとして機能する非同期関数。
 */
export function withAuth(handler, { allowedRoles = [] } = {}) {
  return async (req, { params }) => {
    try {
      // 1. リクエストからトークンを検証し、ユーザー情報を取得
      const user = verifyTokenFromCookie(req);

      // 2. 認可チェック: 許可されたロールに含まれているか確認
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return new Response(JSON.stringify({ error: 'この操作を行う権限がありません。' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 3. 認証・認可を通過した場合、元のハンドラを実行
      //    検証済みのユーザー情報をハンドラに渡す
      return await handler(req, { user, params });

    } catch (err) {
      // トークン検証エラー（無効、期限切れなど）
      if (err.message.includes('トークン')) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // その他の予期せぬエラー
      console.error('API認証ラッパーで予期せぬエラー:', err);
      return new Response(JSON.stringify({ error: 'サーバー内部でエラーが発生しました。' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
