// src/lib/authConfig.js
// タイトル: 認証設定ファイル（最終確定版）
// 役割: 公開パスと管理者パスの判定ロジックをシンプルかつ確実に定義します。

// 認証なしでアクセスできるページのパス（完全一致）
const PUBLIC_PAGES = [
  '/',
  '/login',
  '/users/register',
  '/setup',
];

// 認証なしでアクセスできるAPIのパス（前方一致）
const PUBLIC_API_PREFIXES = [
  '/api/users/login',
  '/api/users/register',
  '/api/setup',
  '/api/tables',
  '/api/users/check-admin',
];

/**
 * 指定されたパスが公開パス（認証不要）かどうかを判定します。
 * @param {string} pathname - 判定対象のパス
 * @returns {boolean} 公開パスであればtrueを返す
 */
export function isPublicPath(pathname) {
  // 公開ページリストに完全一致するかチェック
  if (PUBLIC_PAGES.includes(pathname)) {
    return true;
  }

  // 公開APIリストのプレフィックスに一致するかチェック
  if (PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

/**
 * 指定されたパスが管理者専用パスかどうかを判定します。
 * @param {string} pathname - 判定対象のパス
 * @returns {boolean} 管理者専用パスであればtrueを返す
 */
export function isAdminPath(pathname) {
  return pathname.startsWith('/admin');
}