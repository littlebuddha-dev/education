// src/lib/useAuthGuard.js
// 役割: 未認証ユーザーをログインページにリダイレクトするカスタムフック

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function useAuthGuard() {
  const { user, token, loading } = useAuth(); // loadingがあればそれを使う想定
  const router = useRouter();

  useEffect(() => {
    // ロードが完了してもユーザー/トークンがない場合はリダイレクト
    if (!loading && !token) {
      // 現在のパスをクエリパラメータに含めてリダイレクトすると親切
      const currentPath = window.location.pathname;
      router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
    }
  }, [user, token, loading, router]);

  return { user, token, loading };
}