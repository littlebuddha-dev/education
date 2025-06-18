// /src/context/AuthContext.js
// 役割: アプリ全体の認証状態を一元管理する。

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setAccessToken, getAccessToken } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    apiClient('/api/users/logout', { method: 'POST' }).finally(() => {
      window.location.href = '/login';
    });
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // ✅【修正】credentials: 'include' を追加してCookieをリクエストに含める
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.accessToken);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setAccessToken(null);
        }
      } catch (err) {
        console.error("Initial auth check failed:", err);
        setIsAuthenticated(false);
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();

    const tokenRefreshedListener = (event) => {
      if(event.detail.accessToken) setAccessToken(event.detail.accessToken);
      if(event.detail.user) setUser(event.detail.user);
      setIsAuthenticated(true);
    };
    
    const logoutListener = () => {
        handleLogout();
    };

    window.addEventListener('tokenRefreshed', tokenRefreshedListener);
    window.addEventListener('logout', logoutListener);

    return () => {
        window.removeEventListener('tokenRefreshed', tokenRefreshedListener);
        window.removeEventListener('logout', logoutListener);
    };
  }, [handleLogout]);


  const login = useCallback(async (accessToken, userData) => {
    setAccessToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout: handleLogout
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