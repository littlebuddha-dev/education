// src/context/AuthContext.js
// タイトル: 認証コンテキスト (useMemoによる安定化版)
// 役割: [修正] Contextが提供するvalueオブジェクトをuseMemoでメモ化し、
//       状態の安定性を向上させ、不要な再レンダリングを防ぎます。

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getCookie, setAuthCookie, removeAuthCookie } from '@/utils/authUtils';

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
    const currentToken = getCookie('token');
    if (currentToken) {
      try {
        const decodedUser = jwtDecode(currentToken);
        setSession({
          user: decodedUser,
          token: currentToken,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error("Invalid token found on initial load:", error);
        removeAuthCookie();
        setSession(initialState);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken) => {
    setAuthCookie(newToken);
    try {
      const decodedUser = jwtDecode(newToken);
      setSession({
        user: decodedUser,
        token: newToken,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Failed to decode token on login:", error);
      setSession(initialState);
    }
  }, []);

  const logout = useCallback(() => {
    removeAuthCookie();
    setSession(initialState);
  }, []);

  // [修正] useMemoを使用して、sessionオブジェクトが変更された場合のみvalueオブジェクトを再生成
  const value = useMemo(() => ({
    ...session,
    isLoading,
    login,
    logout
  }), [session, isLoading, login, logout]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
