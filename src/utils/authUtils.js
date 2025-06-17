// src/utils/authUtils.js
// タイトル: 認証ユーティリティ（最終修正版）
// 役割: 脆弱な手動トークン解析を廃止し、安全なjwt-decodeライブラリに統一します。

import { jwtDecode } from 'jwt-decode'; // 専門ライブラリをインポート

const COOKIE_CONFIG = {
  name: 'token',
  maxAge: 7 * 24 * 60 * 60, // 7日間
  path: '/',
  sameSite: 'Lax',
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
    const cookieString = `${COOKIE_CONFIG.name}=${encodeURIComponent(token)}; path=${COOKIE_CONFIG.path}; max-age=${COOKIE_CONFIG.maxAge}; SameSite=${COOKIE_CONFIG.sameSite}`;
    document.cookie = cookieString;
    console.log('✅ Cookie設定完了');
  } catch (error) {
    console.error('❌ Cookie設定エラー:', error);
  }
}

export function removeAuthCookie() {
  if (typeof document === 'undefined') return;

  try {
    // 複数の設定でCookieを確実に削除
    const domain = window.location.hostname;
    const commonPath = `path=${COOKIE_CONFIG.path}; SameSite=${COOKIE_CONFIG.sameSite}`;
    
    document.cookie = `${COOKIE_CONFIG.name}=; ${commonPath}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    if (domain !== 'localhost') {
        document.cookie = `${COOKIE_CONFIG.name}=; ${commonPath}; domain=${domain}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    console.log('🗑️ Cookie削除完了');
  } catch (error) {
    console.error('Cookie削除エラー:', error);
  }
}

/**
 * 🔧 修正: jwt-decode を使用してトークンの有効性を堅牢にチェックします。
 */
export function isTokenValid() {
  const token = getCookie(COOKIE_CONFIG.name);
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    
    // 有効期限 (exp) が存在し、かつ現在時刻が有効期限を過ぎていたら無効
    if (decoded.exp && now >= decoded.exp) {
      console.log('トークンの有効期限切れ');
      removeAuthCookie();
      return false;
    }

    return true;
  } catch (error) {
    console.error('トークン検証エラー:', error);
    removeAuthCookie(); // 不正なトークンは削除
    return false;
  }
}

/**
 * 🔧 修正: jwt-decode を使用して安全にユーザー情報を取得します。
 */
export function getUserFromToken() {
  // isTokenValidは内部で有効期限チェックと不正トークンの削除を行う
  if (!isTokenValid()) return null;

  try {
    const token = getCookie(COOKIE_CONFIG.name);
    // isTokenValidでチェック済みなので、ここではデコードするだけ
    const decodedPayload = jwtDecode(token);
    
    return {
      id: decodedPayload.id,
      email: decodedPayload.email,
      first_name: decodedPayload.first_name,
      last_name: decodedPayload.last_name,
      role: decodedPayload.role,
    };
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    // エラーが起きた場合は念のためCookieを削除
    removeAuthCookie();
    return null;
  }
}

// 互換性のための関数 (変更なし)
export function ensureCookieSync(token) {
  setAuthCookie(token);
}

// 互換性のための関数 (変更なし)
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