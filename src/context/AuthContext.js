// src/context/AuthContext.js
// 修正版：isLoadingの状態管理をより厳密に
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCookie, setAuthCookie, removeAuthCookie, getUserFromToken, isTokenValid } from '@/utils/authUtils';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true); // 初期値はtrue
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 AuthContext: 認証状態の初期化開始');
    
    // 非同期処理として定義
    const initializeAuth = async () => {
      try {
        setError(null);
        
        // isTokenValidとgetUserFromTokenは同期的だが、将来的な拡張性を考慮
        if (isTokenValid()) {
          const user = getUserFromToken();
          const token = getCookie('token');
          if (user && token) {
            console.log(`AuthContext: 認証状態を復元 - ${user.email} (${user.role})`);
            setSession({ user, token, isAuthenticated: true });
          } else {
            setSession(initialState);
          }
        } else {
          console.log('AuthContext: 有効なトークンが見つかりません');
          setSession(initialState);
        }
      } catch (err) {
        console.error('AuthContext: 初期化エラー:', err);
        setError('認証状態の復元に失敗しました');
        setSession(initialState);
      } finally {
        // 全ての処理が終わってからisLoadingをfalseにする
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // このuseEffectはマウント時に一度だけ実行

  const login = useCallback(async (token, userData = null) => {
    try {
      setError(null);
      if (!token) throw new Error('トークンが提供されていません');

      setAuthCookie(token);
      const user = userData || getUserFromToken();
      if (!user) throw new Error('ユーザー情報の取得に失敗しました');

      console.log(`AuthContext: ログイン成功 - ${user.email} (${user.role})`);
      setSession({ user, token, isAuthenticated: true });
      return { success: true };

    } catch (err) {
      console.error('AuthContext: ログインエラー:', err);
      setError(err.message);
      removeAuthCookie();
      setSession(initialState);
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      console.log('AuthContext: ログアウト実行');
      removeAuthCookie();
      setSession(initialState);
      setError(null);
    } catch (error) {
      console.error('AuthContext: ログアウトエラー:', error);
      setSession(initialState);
    }
  }, []);

  const getCurrentToken = useCallback(() => getCookie('token'), []);

  const value = {
    ...session,
    isLoading,
    error,
    login,
    logout,
    getCurrentToken,
    isTokenValid,
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
    throw new Error('useAuth は AuthProvider 内で使用する必要があります');
  }
  return context;
};