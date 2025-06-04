// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/lib/useAuthGuard.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getCookie, removeAuthCookie } from '@/utils/authUtils'; // removeAuthCookie もインポート

export function useAuthGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [authToken, setAuthToken] = useState(null); // ✅ 追加: 認証トークン文字列

  useEffect(() => {
    const token = getCookie('token');
    const currentPath = window.location.pathname;

    if (!token) {
      // トークンがない場合、ログインページへリダイレクト
      console.log('useAuthGuard: No token found. Redirecting to login.');
      const redirectTo = encodeURIComponent(currentPath);
      router.replace(`/login?redirectTo=${redirectTo}`);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setAuthToken(token); // ✅ トークン文字列をセット
      setUserRole(decoded.role);
      setTokenInfo(decoded);

      let redirectPath = null;

      // ロールと現在のパスに基づいてリダイレクトの必要性を判断
      if (currentPath.startsWith('/admin')) {
        if (decoded.role !== 'admin') {
          redirectPath = '/login'; // AdminページにAdmin以外がアクセスしたらログインへ
        }
      } else if (currentPath.startsWith('/children') || currentPath.startsWith('/users')) {
        // 保護者ページ。保護者か管理者のみアクセス可能。
        if (decoded.role !== 'parent' && decoded.role !== 'admin') {
          redirectPath = '/login'; // 保護者か管理者以外がアクセスしたらログインへ
        }
      } else if (currentPath.startsWith('/chat')) {
        // チャットページ。子どもか保護者か管理者のみアクセス可能。
        if (decoded.role !== 'child' && decoded.role !== 'parent' && decoded.role !== 'admin') {
          redirectPath = '/login'; // いずれのロールでもなければログインへ
        }
      } else if (currentPath === '/') {
        // ホームページからのリダイレクトは、ログインしていればロールに応じたページへ
        if (decoded.role === 'child') {
          redirectPath = '/chat';
        } else if (decoded.role === 'parent') {
          redirectPath = '/children';
        } else if (decoded.role === 'admin') {
          redirectPath = '/admin/users';
        }
      } else if (currentPath.startsWith('/login') || currentPath.startsWith('/users/register') || currentPath.startsWith('/setup')) {
        // 認証済みのユーザーがログイン/登録/セットアップページにアクセスした場合、各ロールのダッシュボードへリダイレクト
        if (decoded.role === 'child') {
            redirectPath = '/chat';
        } else if (decoded.role === 'parent') {
            redirectPath = '/children';
        } else if (decoded.role === 'admin') {
            redirectPath = '/admin/users';
        }
      }

      // 実際にリダイレクトが必要な場合のみ実行
      if (redirectPath && redirectPath !== currentPath) {
        console.log(`useAuthGuard: Redirecting from ${currentPath} to ${redirectPath} for role ${decoded.role}.`);
        router.replace(redirectPath);
      } else {
        // リダイレクトが必要ない、またはすでに適切なページにいる場合
        setReady(true);
      }

    } catch (err) {
      console.error('useAuthGuard: Token decode error or invalid token:', err);
      // 無効なトークンの場合、Cookieを削除してログインページへ
      removeAuthCookie();
      const redirectTo = encodeURIComponent(currentPath);
      router.replace(`/login?redirectTo=${redirectTo}`);
    }
  }, [router]);

  return { ready, userRole, tokenInfo, authToken }; // ✅ authToken も返す
}
