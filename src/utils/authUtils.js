// src/utils/authUtils.js
// タイトル: 認証ユーティリティ (Cookie特化版)
// 役割: クライアントサイドでの認証Cookieの操作（取得、設定、削除）を一元管理します。localStorageへのフォールバックを廃止し、Cookieに一本化しました。

/**
 * Cookieから指定された名前の値を取得します。
 * @param {string} name - 取得したいCookieの名前
 * @returns {string | null} Cookieの値。存在しない場合はnull。
 */
export function getCookie(name) {
  if (typeof document === 'undefined') {
    return null; // サーバーサイドでは何もしない
  }
  const allCookies = document.cookie;
  const regex = new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
  const match = allCookies.match(regex);
  return match ? match[2] : null;
}

/**
 * 認証トークンをCookieに設定します。
 * @param {string} token - 設定するJWT
 */
export function setAuthCookie(token) {
  if (typeof document === 'undefined') {
    return; // サーバーサイドでは何もしない
  }
  const maxAge = 7 * 24 * 60 * 60; // 7日間（秒）
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // localhostでない場合、またはセキュアな接続の場合はSecureフラグを付与
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = !isLocalhost || isSecure ? '; Secure' : '';

  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
}


/**
 * 認証トークンのCookieを削除します。
 */
export function removeAuthCookie() {
  if (typeof document === 'undefined') {
    return; // サーバーサイドでは何もしない
  }
  // Cookieを過去の日付に設定して削除
  document.cookie = 'token=; Max-Age=0; path=/;';
}

/**
 * Cookieに保存されたトークンの有効期限をチェックします。
 * @returns {boolean} トークンが有効な場合はtrue、それ以外はfalse。
 */
export function isTokenValid() {
  const token = getCookie('token');
  if (!token) {
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return false;
    }
    const payload = JSON.parse(atob(parts[1]));

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      removeAuthCookie(); // 期限切れのトークンは削除
      return false;
    }
    return true;
  } catch (err) {
    console.error('Token validation error:', err);
    removeAuthCookie(); // 不正なトークンは削除
    return false;
  }
}