// src/lib/useAuthGuard.js
// タイトル: 認証ガードフック（リファクタリング版）
// 役割: クライアントサイドでの認証チェックとリダイレクト処理を、よりシンプルで宣言的なロジックで実現します。

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getCookie, removeAuthCookie } from '@/utils/authUtils';
import { publicPaths } from '@/lib/authConfig';

// ユーザーの役割に応じたデフォルトのリダイレクト先を定義
const DASHBOARD_PATHS = {
  admin: '/admin/users',
  parent: '/children',
  child: '/chat',
};

// ログインページなど、認証済みユーザーがアクセスすべきでないページのリスト
const AUTH_PAGES = ['/login', '/users/register', '/setup'];

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // ユーザー情報を一元管理

  useEffect(() => {
    const token = getCookie('token');
    const isPublicPage = publicPaths.some(p => pathname.startsWith(p));
    const isAuthPage = AUTH_PAGES.includes(pathname);

    // 1. トークンがない場合
    if (!token) {
      // 公開ページでもなく、APIルートでもなければログインページへ
      if (!isPublicPage && !pathname.startsWith('/api')) {
        console.log('🔐 useAuthGuard: トークンなし、保護されたページ → リダイレクト');
        router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`);
        return;
      }
      // 公開ページの場合はそのまま表示
      setIsReady(true);
      return;
    }

    // 2. トークンがある場合
    try {
      const decoded = jwtDecode(token);
      setUserInfo(decoded);

      // 認証済みユーザーが認証ページにアクセスした場合、ダッシュボードへ
      if (isAuthPage) {
        const dashboardPath = DASHBOARD_PATHS[decoded.role] || '/';
        console.log(`🔐 useAuthGuard: 認証済み、認証ページ → ${dashboardPath}へリダイレクト`);
        router.replace(dashboardPath);
        return;
      }

      // 3. 権限チェック（例: 管理者ページ）
      if (pathname.startsWith('/admin') && decoded.role !== 'admin') {
          console.log('🔐 useAuthGuard: 管理者ページへの不正アクセス → リダイレクト');
          router.replace('/login'); // または適切なエラーページへ
          return;
      }

      // すべてのチェックを通過
      setIsReady(true);

    } catch (err) {
      console.error('🔐 useAuthGuard: トークンデコードエラー:', err);
      removeAuthCookie();
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`);
    }

  }, [pathname, router]);

  return {
    ready: isReady,
    userRole: userInfo?.role || null,
    tokenInfo: userInfo,
    authToken: getCookie('token'), // authTokenは必要に応じて最新のCookieを返す
  };
}