// src/utils/authUtils.js
// Cookieから値を取り出す関数
export function getCookie(name) {
  if (typeof document === 'undefined') {
    return null; // サーバーサイドでは何も返さない
  }
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// Cookieにトークンをセットする関数
export function setAuthCookie(token) {
  if (typeof document === 'undefined') {
    return; // サーバーサイドでは何もしない
  }
  
  // 7日間の有効期限を設定（JWTトークンの有効期限と合わせる）
  const maxAge = 7 * 24 * 60 * 60; // 7日間（秒）
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure=${location.protocol === 'https:'}`;
  
  console.log('Cookie設定完了:', token.substring(0, 20) + '...');
}

// Cookieからトークンを削除する関数
export function removeAuthCookie() {
  if (typeof document === 'undefined') {
    return; // サーバーサイドでは何もしない
  }
  
  document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
  console.log('Cookie削除完了');
}

// トークンの有効性をチェックする関数
export function isTokenValid() {
  const token = getCookie('token');
  if (!token) return false;
  
  try {
    // JWTの形式チェック（簡易）
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // ペイロード部分をデコード
    const payload = JSON.parse(atob(parts[1]));
    
    // 有効期限をチェック
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.log('トークンが期限切れです');
      removeAuthCookie();
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('トークン検証エラー:', err);
    removeAuthCookie();
    return false;
  }
}
