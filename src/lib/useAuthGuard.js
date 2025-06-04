// src/lib/useAuthGuard.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getCookie, removeAuthCookie } from '@/utils/authUtils';

export function useAuthGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const token = getCookie('token');
    const currentPath = window.location.pathname;

    console.log('useAuthGuard: 開始', { currentPath, hasToken: !!token });

    if (!token) {
      console.log('useAuthGuard: トークンなし、ログインページへリダイレクト');
      const redirectTo = encodeURIComponent(currentPath);
      router.replace(`/login?redirectTo=${redirectTo}`);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('useAuthGuard: トークンデコード成功', { role: decoded.role, currentPath });
      
      setAuthToken(token);
      setUserRole(decoded.role);
      setTokenInfo(decoded);

      // アクセス権限チェック
      let hasAccess = true;
      let redirectPath = null;

      if (currentPath.startsWith('/admin')) {
        // 管理者ページ - 管理者のみアクセス可能
        if (decoded.role !== 'admin') {
          console.log('useAuthGuard: 管理者ページに非管理者がアクセス');
          hasAccess = false;
          redirectPath = '/login';
        }
      } else if (currentPath.startsWith('/children') || currentPath.startsWith('/users')) {
        // 保護者・ユーザーページ - 保護者または管理者のみアクセス可能
        if (decoded.role !== 'parent' && decoded.role !== 'admin') {
          console.log('useAuthGuard: 保護者ページに権限なしユーザーがアクセス');
          hasAccess = false;
          redirectPath = '/login';
        }
      } else if (currentPath.startsWith('/chat')) {
        // チャットページ - 子ども、保護者、管理者がアクセス可能
        if (decoded.role !== 'child' && decoded.role !== 'parent' && decoded.role !== 'admin') {
          console.log('useAuthGuard: チャットページに権限なしユーザーがアクセス');
          hasAccess = false;
          redirectPath = '/login';
        }
      } else if (currentPath === '/') {
        // ホームページ - ロールに応じたページにリダイレクト
        console.log('useAuthGuard: ホームページからリダイレクト');
        if (decoded.role === 'child') {
          redirectPath = '/chat';
        } else if (decoded.role === 'parent') {
          redirectPath = '/children';
        } else if (decoded.role === 'admin') {
          redirectPath = '/admin/users';
        }
      } else if (currentPath.startsWith('/login') || currentPath.startsWith('/users/register') || currentPath.startsWith('/setup')) {
        // 認証済みユーザーが認証ページにアクセス - ダッシュボードにリダイレクト
        console.log('useAuthGuard: 認証済みユーザーが認証ページにアクセス');
        if (decoded.role === 'child') {
          redirectPath = '/chat';
        } else if (decoded.role === 'parent') {
          redirectPath = '/children';
        } else if (decoded.role === 'admin') {
          redirectPath = '/admin/users';
        }
      }

      // アクセス権限がない場合
      if (!hasAccess) {
        console.log('useAuthGuard: アクセス権限なし、リダイレクト:', redirectPath);
        router.replace(redirectPath);
        return;
      }

      // リダイレクトが必要で、かつ現在のパスと異なる場合のみ実行
      if (redirectPath && redirectPath !== currentPath) {
        console.log('useAuthGuard: リダイレクト実行:', { from: currentPath, to: redirectPath });
        router.replace(redirectPath);
        return;
      }

      // すべてのチェックが完了し、適切なページにいる場合
      console.log('useAuthGuard: 認証完了、ready状態をtrueに設定');
      setReady(true);

    } catch (err) {
      console.error('useAuthGuard: トークンデコードエラー:', err);
      removeAuthCookie();
      const redirectTo = encodeURIComponent(currentPath);
      router.replace(`/login?redirectTo=${redirectTo}`);
    }
  }, [router]); // routerのみを依存関係に設定

  return { ready, userRole, tokenInfo, authToken };
}
