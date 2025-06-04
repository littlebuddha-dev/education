// src/lib/useAuthGuard.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getCookie, removeAuthCookie } from '@/utils/authUtils';

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname(); // usePathnameを使用してより確実にパスを取得
  const [ready, setReady] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    console.log('🔐 useAuthGuard: 開始', { pathname });

    const token = getCookie('token');
    console.log('🔐 useAuthGuard: トークン確認', { hasToken: !!token, tokenLength: token?.length });

    if (!token) {
      console.log('🔐 useAuthGuard: トークンなし → ログインページへリダイレクト');
      const redirectTo = encodeURIComponent(pathname);
      router.replace(`/login?redirectTo=${redirectTo}`);
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
      console.log('🔐 useAuthGuard: トークンデコード成功', { 
        userId: decoded.id, 
        role: decoded.role, 
        email: decoded.email,
        exp: new Date(decoded.exp * 1000).toLocaleString()
      });
    } catch (err) {
      console.error('🔐 useAuthGuard: トークンデコードエラー:', err);
      removeAuthCookie();
      const redirectTo = encodeURIComponent(pathname);
      router.replace(`/login?redirectTo=${redirectTo}`);
      return;
    }

    // 状態を設定
    setAuthToken(token);
    setUserRole(decoded.role);
    setTokenInfo(decoded);

    // アクセス権限とリダイレクトの判定
    console.log('🔐 useAuthGuard: アクセス権限チェック', { pathname, role: decoded.role });

    let shouldRedirect = false;
    let redirectPath = null;
    let reason = '';

    if (pathname.startsWith('/admin')) {
      if (decoded.role !== 'admin') {
        shouldRedirect = true;
        redirectPath = '/login';
        reason = '管理者ページに非管理者がアクセス';
      }
    } else if (pathname.startsWith('/children') || pathname.startsWith('/users')) {
      if (decoded.role !== 'parent' && decoded.role !== 'admin') {
        shouldRedirect = true;
        redirectPath = '/login';
        reason = '保護者ページに権限なしユーザーがアクセス';
      }
    } else if (pathname.startsWith('/chat')) {
      if (decoded.role !== 'child' && decoded.role !== 'parent' && decoded.role !== 'admin') {
        shouldRedirect = true;
        redirectPath = '/login';
        reason = 'チャットページに権限なしユーザーがアクセス';
      }
    } else if (pathname === '/') {
      shouldRedirect = true;
      reason = 'ホームページからロール別ページにリダイレクト';
      if (decoded.role === 'child') {
        redirectPath = '/chat';
      } else if (decoded.role === 'parent') {
        redirectPath = '/children';
      } else if (decoded.role === 'admin') {
        redirectPath = '/admin/users';
      }
    } else if (pathname.startsWith('/login') || pathname.startsWith('/users/register') || pathname.startsWith('/setup')) {
      shouldRedirect = true;
      reason = '認証済みユーザーが認証ページにアクセス';
      if (decoded.role === 'child') {
        redirectPath = '/chat';
      } else if (decoded.role === 'parent') {
        redirectPath = '/children';
      } else if (decoded.role === 'admin') {
        redirectPath = '/admin/users';
      }
    }

    console.log('🔐 useAuthGuard: リダイレクト判定', {
      shouldRedirect,
      redirectPath,
      reason,
      currentPath: pathname
    });

    if (shouldRedirect && redirectPath && redirectPath !== pathname) {
      console.log('🔐 useAuthGuard: リダイレクト実行', { from: pathname, to: redirectPath, reason });
      router.replace(redirectPath);
      return;
    }

    // リダイレクトが不要な場合は ready を true にする
    console.log('🔐 useAuthGuard: 認証完了、ready状態をtrueに設定');
    setReady(true);

  }, [pathname, router]); // pathnameとrouterを依存関係に

  console.log('🔐 useAuthGuard: 現在の状態', { ready, userRole, hasToken: !!authToken });

  return { ready, userRole, tokenInfo, authToken };
}
