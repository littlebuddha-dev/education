// src/components/AuthGuard.js
// 役割: 認証状態の監視と保護。Hydrationエラー対策済み。

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isPublicPage, isAdminPage } from '@/lib/authConfig';

export default function AuthGuard({ children }) {
  const { user, isAuthenticated, hasInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Hydrationエラーを防ぐためのマウント状態管理
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // マウント前や初期化前は何もしない
    if (!mounted || !hasInitialized) return;

    const isPublic = isPublicPage(pathname);
    const isAuthPage = ['/login', '/users/register', '/setup'].includes(pathname);

    if (isAuthenticated) {
      // 認証済みの場合の制御
      if (isAuthPage) {
        const dashboardPaths = { admin: '/admin/users', parent: '/children', child: '/chat' };
        // userがnullでないことを確認
        const role = user?.role || 'parent';
        router.replace(dashboardPaths[role] || '/');
      }
      else if (isAdminPage(pathname) && user?.role !== 'admin') {
        router.replace('/');
      }
    } else if (!isPublic) {
      // 未認証で保護ページにアクセスした場合
      const redirectTo = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
  }, [mounted, hasInitialized, isAuthenticated, user, pathname, router, searchParams]);
  
  // マウント前は何もレンダリングしない（これでサーバーとクライアントの不一致を防ぐ）
  if (!mounted) {
    return null;
  }

  // 認証情報の確認中はローディング表示
  if (!hasInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
        <p className="text-gray-500">認証情報を確認しています...</p>
      </div>
    );
  }

  // チェック完了後、コンテンツを表示
  return <>{children}</>;
}