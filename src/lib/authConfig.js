// src/lib/authConfig.js
// タイトル: 認証関連設定ファイル
// 役割: アプリケーション全体で使用する認証関連の静的な設定（公開パスなど）を一元管理します。

// ログインや認証が不要なページのパスリスト
// middleware.js と useAuthGuard.js で共通して使用します。
export const publicPaths = [
  '/', // トップページ（認証状態でリダイレクト先が変わるため、認証チェックは行う）
  '/login',
  '/users/register',
  '/setup',
  '/favicon.ico',
  // API Routes
  '/api/users/login',
  '/api/users/register',
  '/api/setup',
  '/api/tables',
  '/api/users/check-admin',
  // Next.js internal paths
  '/_next',
  '/static',
  '/_app',
];