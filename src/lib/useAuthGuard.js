// /src/lib/useAuthGuard.js
// 役割: クライアントサイドの認証ガード。AuthContextを参照するように全面的に修正。

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // ✅ AuthContext を参照
import { isPublicPath } from '@/lib/authConfig';

const AUTH_PAGES = ['/login', '/users/register', '/setup'];
const DASHBOARD_PATHS = {
  admin: '/admin/users',
  parent: '/children',
  child: '/chat',
};

export function useAuthGuard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // AuthContextの認証状態が確定するまで待機
    if (isLoading) {
      return;
    }

    const isPublic = isPublicPath(pathname);
    const isAuthPage = AUTH_PAGES.includes(pathname);

    // ログイン済みユーザーの処理
    if (isAuthenticated && user) {
      // ログインページにいる場合は、役割に応じたダッシュボードへリダイレクト
      if (isAuthPage) {
        const dashboardPath = DASHBOARD_PATHS[user.role] || '/';
        router.replace(dashboardPath);
        return;
      }
      // 管理者でないユーザーが管理者ページにアクセスしようとした場合
      if (pathname.startsWith('/admin') && user.role !== 'admin') {
        router.replace('/');
        return;
      }
    }

    // 未ログインユーザーの処理
    if (!isAuthenticated) {
      // 保護されたページにアクセスしようとした場合は、ログインページへリダイレクト
      if (!isPublic) {
        const redirectTo = pathname + searchParams.toString();
        router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      }
    }

  }, [isLoading, isAuthenticated, user, pathname, router, searchParams]);

  return !isLoading; // 認証チェックが完了したかどうかを返す
}