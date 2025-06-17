// src/context/AuthContext.js
// タイトル: 認証コンテキスト（最終版）
// 役割: アプリケーション全体の認証状態をクリーンなロジックで管理する。
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (isTokenValid()) {
          const user = getUserFromToken();
          const token = getCookie('token');
          if (user && token) {
            setSession({ user, token, isAuthenticated: true });
          } else {
            setSession(initialState);
          }
        } else {
          setSession(initialState);
        }
      } catch (err) {
        console.error('AuthContext initialization error:', err);
        setSession(initialState);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = useCallback(async (token, userData = null) => {
    setAuthCookie(token); 
    const user = userData || getUserFromToken();
    if (user) {
        setSession({ user, token, isAuthenticated: true });
    }
  }, []);

  const logout = useCallback(() => {
    removeAuthCookie();
    window.location.href = '/login';
  }, []);

  const value = {
    ...session,
    isLoading,
    login,
    logout,
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