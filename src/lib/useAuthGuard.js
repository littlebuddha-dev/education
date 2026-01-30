// src/lib/useAuthGuard.js
// 役割: 未認証ユーザーをログインページにリダイレクトするカスタムフック
// 修正: 廃止された token ではなく isAuthenticated を使用して判定するように修正

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function useAuthGuard() {
  // loading ではなく isLoading が正しいプロパティ名である可能性が高いため両対応
  // token は削除されたため isAuthenticated を使用
  const { user, isAuthenticated, isLoading, loading } = useAuth();
  
  // AuthContextの実装揺れを吸収
  const isAuthLoading = isLoading !== undefined ? isLoading : loading;
  
  const router = useRouter();

  useEffect(() => {
    // ロードが完了しても認証されていない場合はリダイレクト
    if (!isAuthLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
    }
  }, [user, isAuthenticated, isAuthLoading, router]);

  return { user, isAuthenticated, loading: isAuthLoading };
}