// src/utils/authUtils.js
// 最終修正版：開発環境でのCookie問題を解決

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
    
    // 🔧 修正：開発環境向けの最もシンプルな設定
    const simpleCookie = `${COOKIE_CONFIG.name}=${token}; path=/; max-age=${COOKIE_CONFIG.maxAge}`;
    document.cookie = simpleCookie;
    console.log('🍪 シンプル設定:', simpleCookie);
    
    // 即座に確認
    const immediateCheck = getCookie(COOKIE_CONFIG.name);
    if (immediateCheck) {
      console.log('✅ Cookie設定成功 (即座確認)');
    } else {
      console.log('⚠️ Cookie設定未確認、再試行中...');
      
      // 🔧 修正：エンコーディングなしで再試行
      document.cookie = `${COOKIE_CONFIG.name}=${token}; path=/`;
      
      // 少し待ってから確認
      setTimeout(() => {
        const delayedCheck = getCookie(COOKIE_CONFIG.name);
        if (delayedCheck) {
          console.log('✅ Cookie設定成功 (遅延確認)');
        } else {
          console.error('❌ Cookie設定失敗 - 手動設定を推奨');
          console.log('手動設定用コマンド:');
          console.log(`document.cookie = "token=${token}; path=/"; location.reload();`);
        }
      }, 500);
    }

  } catch (error) {
    console.error('❌ Cookie設定エラー:', error);
    console.log('手動設定用コマンド:');
    console.log(`document.cookie = "token=${token}; path=/"; location.reload();`);
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

// 🔧 追加：開発環境用のデバッグヘルパー
export function debugCookieState() {
  console.log('🔍 Cookie Debug Info:');
  console.log('Current cookies:', document.cookie);
  console.log('Token exists:', document.cookie.includes('token'));
  console.log('Token value:', getCookie('token')?.substring(0, 50) + '...');
  console.log('Token valid:', isTokenValid());
  console.log('User from token:', getUserFromToken());
}