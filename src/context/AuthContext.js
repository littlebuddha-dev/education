// /src/context/AuthContext.js
// 役割: アプリ全体の認証状態を一元管理する。

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
// 名前付きインポートを使用
import { apiClient, setAccessToken } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    console.log('[AuthContext] Logging out...');
    // setAccessTokenが関数として存在するか確認してから実行
    if (typeof setAccessToken === 'function') {
      setAccessToken(null);
    }
    setUser(null);
    setIsAuthenticated(false);
    
    // ログアウトAPIを呼び出すが、失敗しても強制的にログイン画面へ
    apiClient('/api/users/logout', { method: 'POST' })
      .catch(err => console.error('Logout API failed:', err))
      .finally(() => {
        window.location.href = '/login';
      });
  }, []);

  const checkAuthStatus = useCallback(async () => {
    console.log('[AuthContext] Checking auth status...');
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[AuthContext] Auth check successful');
        
        // ここでエラーが出ないようチェック
        if (typeof setAccessToken === 'function') {
          setAccessToken(data.accessToken);
        } else {
          console.error('[AuthContext] setAccessToken is not a function');
        }

        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        console.log('[AuthContext] Auth check failed or no session');
        setIsAuthenticated(false);
        setUser(null);
        if (typeof setAccessToken === 'function') setAccessToken(null);
      }
    } catch (err) {
      console.error("[AuthContext] Auth check error:", err);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      // どんなエラーが起きても必ず初期化完了とする
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();

    const tokenRefreshedListener = (event) => {
      console.log('[AuthContext] Token refreshed event received');
      if (event.detail?.accessToken && typeof setAccessToken === 'function') {
        setAccessToken(event.detail.accessToken);
      }
      if (event.detail?.user) {
        setUser(event.detail.user);
        setIsAuthenticated(true);
      }
    };
    
    const logoutListener = () => {
      console.log('[AuthContext] Logout event received');
      handleLogout();
    };

    window.addEventListener('tokenRefreshed', tokenRefreshedListener);
    window.addEventListener('logout', logoutListener);

    return () => {
      window.removeEventListener('tokenRefreshed', tokenRefreshedListener);
      window.removeEventListener('logout', logoutListener);
    };
  }, [handleLogout, checkAuthStatus]);

  // login関数もシンプルに
  const login = useCallback(async (accessToken, userData) => {
    if (typeof setAccessToken === 'function') {
      setAccessToken(accessToken);
    }
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    hasInitialized,
    login,
    logout: handleLogout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};