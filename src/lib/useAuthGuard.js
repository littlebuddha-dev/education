// /src/lib/useAuthGuard.js
// 役割: クライアントサイドの認証ガード。AuthContextを参照するように全面的に修正。
// 🔧 修正: ログインループを解消するため、シンプルで安全な認証ガードに変更

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isPublicPage, isAdminPage } from '@/lib/authConfig';

export function useAuthGuard() {
  const { user, isAuthenticated, isLoading, hasInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasProcessed, setHasProcessed] = useState(false);
  const [isReady, setIsReady] = useState(false); // 🔧 追加: ready状態を管理

  useEffect(() => {
    // 初期化が完了していない場合は待機
    if (!hasInitialized) {
      console.log('[AuthGuard] Waiting for initialization...');
      return;
    }

    // 既に処理済みの場合はスキップ
    if (hasProcessed) {
      return;
    }

    console.log('[AuthGuard] Processing:', { 
      pathname, 
      isAuthenticated, 
      userRole: user?.role,
      isLoading 
    });

    const isPublic = isPublicPage(pathname);
    const isAuthPage = ['/login', '/users/register', '/setup'].includes(pathname);

    // 🔧 修正: 認証済みユーザーの処理をシンプルに
    if (isAuthenticated && user) {
      // 認証ページにいる場合は適切なダッシュボードへリダイレクト
      if (isAuthPage) {
        console.log('[AuthGuard] Authenticated user on auth page, redirecting...');
        setHasProcessed(true);
        
        const dashboardPaths = {
          admin: '/admin/users',
          parent: '/children',
          child: '/chat',
        };
        const targetPath = dashboardPaths[user.role] || '/';
        
        setTimeout(() => {
          router.replace(targetPath);
        }, 100);
        return;
      }
      
      // 管理者ページへの権限チェック
      if (isAdminPage(pathname) && user.role !== 'admin') {
        console.log('[AuthGuard] Non-admin user accessing admin page, redirecting to home...');
        setHasProcessed(true);
        router.replace('/');
        return;
      }
    }

    // 🔧 修正: 未認証ユーザーの処理をシンプルに
    if (!isAuthenticated && !isPublic) {
      console.log('[AuthGuard] Unauthenticated user accessing protected page, redirecting to login...');
      setHasProcessed(true);
      
      const redirectTo = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    // すべてのチェックが完了
    console.log('[AuthGuard] All checks completed successfully');
    setHasProcessed(true);
    setIsReady(true); // 🔧 追加: ready状態を設定

  }, [hasInitialized, isAuthenticated, user, pathname, router, searchParams, hasProcessed]);

  // パスが変更された場合は処理済みフラグをリセット
  useEffect(() => {
    setHasProcessed(false);
    setIsReady(false); // 🔧 追加: ready状態もリセット
  }, [pathname]);

  return hasInitialized && isReady; // 🔧 修正: 初期化とready状態の両方が完了したかを返す
}