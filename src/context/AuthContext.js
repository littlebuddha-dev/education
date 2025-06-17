// src/context/AuthContext.js
// 修正版：認証コンテキスト（安定性向上・エラーハンドリング強化）
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getCookie, setAuthCookie, removeAuthCookie, getUserFromToken, isTokenValid } from '@/utils/authUtils';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 認証状態の初期化
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setError(null);
        
        if (!isTokenValid()) {
          console.log('AuthContext: 有効なトークンが見つかりません');
          setSession(initialState);
          setIsLoading(false);
          return;
        }

        const user = getUserFromToken();
        const token = getCookie('token');

        if (user && token) {
          console.log(`AuthContext: 認証状態を復元 - ${user.email} (${user.role})`);
          setSession({
            user,
            token,
            isAuthenticated: true,
          });
        } else {
          console.log('AuthContext: ユーザー情報の取得に失敗');
          removeAuthCookie();
          setSession(initialState);
        }
      } catch (error) {
        console.error('AuthContext: 初期化エラー:', error);
        setError('認証状態の復元に失敗しました');
        removeAuthCookie();
        setSession(initialState);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ログイン処理
  const login = useCallback(async (token, userData = null) => {
    try {
      setError(null);
      
      if (!token) {
        throw new Error('トークンが提供されていません');
      }

      // Cookieに保存
      setAuthCookie(token);
      
      // ユーザー情報の取得
      let user = userData;
      if (!user) {
        user = getUserFromToken();
      }

      if (!user) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      console.log(`AuthContext: ログイン成功 - ${user.email} (${user.role})`);
      
      setSession({
        user,
        token,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error) {
      console.error('AuthContext: ログインエラー:', error);
      setError(error.message);
      removeAuthCookie();
      setSession(initialState);
      return { success: false, error: error.message };
    }
  }, []);

  // ログアウト処理
  const logout = useCallback(() => {
    try {
      console.log('AuthContext: ログアウト実行');
      removeAuthCookie();
      setSession(initialState);
      setError(null);
    } catch (error) {
      console.error('AuthContext: ログアウトエラー:', error);
      // ログアウトエラーでも状態はリセット
      setSession(initialState);
    }
  }, []);

  // トークンの有効性を定期的にチェック
  useEffect(() => {
    if (!session.isAuthenticated) return;

    const checkTokenValidity = () => {
      if (!isTokenValid()) {
        console.log('AuthContext: トークンが無効になりました');
        logout();
      }
    };

    // 5分ごとにチェック
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session.isAuthenticated, logout]);

  // メモ化されたコンテキスト値
  const value = useMemo(() => ({
    ...session,
    isLoading,
    error,
    login,
    logout,
    refreshAuth: () => {
      const user = getUserFromToken();
      const token = getCookie('token');
      if (user && token && isTokenValid()) {
        setSession({ user, token, isAuthenticated: true });
      } else {
        logout();
      }
    }
  }), [session, isLoading, error, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth は AuthProvider 内で使用する必要があります');
  }
  return context;
};