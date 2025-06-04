// src/utils/authUtils.js - localStorage使用版（緊急回避策）
// Cookieから値を取り出す関数（localStorageフォールバック付き）
export function getCookie(name) {
  if (typeof document === 'undefined') {
    console.log('🍪 getCookie: サーバーサイドのため何も返さない');
    return null;
  }
  
  // まずCookieを試行
  const allCookies = document.cookie;
  console.log('🍪 getCookie: 全Cookie:', allCookies);
  
  const regex = new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  const match = allCookies.match(regex);
  
  if (match && match[2]) {
    console.log('🍪 getCookie: Cookieから取得成功');
    return match[2];
  }
  
  // Cookieで取得できない場合はlocalStorageを使用
  console.log('🍪 getCookie: Cookieで取得失敗、localStorageを確認');
  try {
    const tokenFromStorage = localStorage.getItem(name);
    if (tokenFromStorage) {
      console.log('🍪 getCookie: localStorageから取得成功');
      return tokenFromStorage;
    }
  } catch (err) {
    console.error('🍪 getCookie: localStorage取得エラー:', err);
  }
  
  console.log('🍪 getCookie: 両方で取得失敗');
  return null;
}

// トークンをセットする関数（Cookie + localStorage）
export function setAuthCookie(token) {
  if (typeof document === 'undefined') {
    console.log('🍪 setAuthCookie: サーバーサイドのため何もしない');
    return;
  }
  
  console.log('🍪 setAuthCookie: トークン設定開始:', token.substring(0, 20) + '...');
  
  // 1. localStorageに保存（確実）
  try {
    localStorage.setItem('token', token);
    console.log('🍪 setAuthCookie: localStorage保存成功');
  } catch (err) {
    console.error('🍪 setAuthCookie: localStorage保存エラー:', err);
  }
  
  // 2. Cookieにも保存を試行
  const maxAge = 7 * 24 * 60 * 60; // 7日間（秒）
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  
  let cookieString;
  if (isLocalhost) {
    cookieString = `token=${token}; path=/; max-age=${maxAge}`;
  } else {
    const isSecure = location.protocol === 'https:';
    cookieString = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  }
  
  try {
    document.cookie = cookieString;
    console.log('🍪 setAuthCookie: Cookie設定実行');
  } catch (err) {
    console.error('🍪 setAuthCookie: Cookie設定エラー:', err);
  }
  
  // 設定確認
  setTimeout(() => {
    const tokenCheck = getCookie('token');
    console.log('🍪 setAuthCookie: 設定確認:', tokenCheck ? '成功' : '失敗');
  }, 100);
}

// トークンを削除する関数（Cookie + localStorage）
export function removeAuthCookie() {
  if (typeof document === 'undefined') {
    console.log('🍪 removeAuthCookie: サーバーサイドのため何もしない');
    return;
  }
  
  console.log('🍪 removeAuthCookie: トークン削除開始');
  
  // 1. localStorageから削除
  try {
    localStorage.removeItem('token');
    console.log('🍪 removeAuthCookie: localStorage削除成功');
  } catch (err) {
    console.error('🍪 removeAuthCookie: localStorage削除エラー:', err);
  }
  
  // 2. Cookieからも削除
  const deleteMethods = [
    'token=; Max-Age=0; path=/',
    'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/',
    'token='
  ];
  
  deleteMethods.forEach((method) => {
    try {
      document.cookie = method;
    } catch (err) {
      console.error('🍪 removeAuthCookie: Cookie削除エラー:', err);
    }
  });
  
  setTimeout(() => {
    const verification = getCookie('token');
    console.log('🍪 removeAuthCookie: 削除確認:', verification ? '失敗' : '成功');
  }, 100);
}

// トークンの有効性をチェックする関数
export function isTokenValid() {
  const token = getCookie('token');
  if (!token) {
    console.log('🍪 isTokenValid: トークンなし');
    return false;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('🍪 isTokenValid: JWT形式エラー');
      return false;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.log('🍪 isTokenValid: トークンが期限切れ');
      removeAuthCookie();
      return false;
    }
    
    console.log('🍪 isTokenValid: トークン有効');
    return true;
  } catch (err) {
    console.error('🍪 isTokenValid: トークン検証エラー:', err);
    removeAuthCookie();
    return false;
  }
}