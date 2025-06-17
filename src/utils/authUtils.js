// src/utils/authUtils.js
// 安定版：シンプルで確実な認証ユーティリティ

const COOKIE_CONFIG = {
  name: 'token',
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
  sameSite: 'Lax',
  httpOnly: false,
};

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=').map(s => s.trim());
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  } catch (error) {
    console.error(`Cookie取得エラー (${name}):`, error);
    return null;
  }
}

export function setAuthCookie(token) {
  if (typeof document === 'undefined') {
    console.warn('setAuthCookie: サーバーサイドでは実行できません');
    return;
  }

  try {
    console.log('🍪 Cookie設定開始:', token.substring(0, 20) + '...');
    
    // シンプルなCookie設定
    const cookieString = `${COOKIE_CONFIG.name}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_CONFIG.maxAge}; SameSite=Lax`;
    document.cookie = cookieString;
    
    console.log('✅ Cookie設定完了');
  } catch (error) {
    console.error('❌ Cookie設定エラー:', error);
  }
}

export function removeAuthCookie() {
  if (typeof document === 'undefined') return;

  try {
    document.cookie = `${COOKIE_CONFIG.name}=; path=/; max-age=0`;
    document.cookie = `${COOKIE_CONFIG.name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    console.log('🗑️ Cookie削除完了');
  } catch (error) {
    console.error('Cookie削除エラー:', error);
  }
}

export function isTokenValid() {
  const token = getCookie(COOKIE_CONFIG.name);
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('無効なJWT形式');
      removeAuthCookie();
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && now >= payload.exp) {
      console.log('トークンの有効期限切れ');
      removeAuthCookie();
      return false;
    }

    return true;
  } catch (error) {
    console.error('トークン検証エラー:', error);
    removeAuthCookie();
    return false;
  }
}

export function getUserFromToken() {
  if (!isTokenValid()) return null;

  try {
    const token = getCookie(COOKIE_CONFIG.name);
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    return {
      id: payload.id,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      role: payload.role,
    };
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    removeAuthCookie();
    return null;
  }
}

// 互換性のための関数
export function ensureCookieSync(token) {
  setAuthCookie(token);
}

export function withAuthLock(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('withAuthLock エラー:', error);
      throw error;
    }
  };
}