// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/lib/useAuthGuard.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode'; // jwtDecode をインポート
import { getCookie } from '@/utils/authUtils'; // 新しいヘルパーからgetCookieをインポート

export function useAuthGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userRole, setUserRole] = useState(null); // ユーザーロールの状態を追加

  useEffect(() => {
    const token = getCookie('token');
    if (!token) {
      // トークンがなければログインページへリダイレクト
      const redirectTo = encodeURIComponent(window.location.pathname);
      router.replace(`/login?redirectTo=${redirectTo}`);
    } else {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role); // デコードしたロールを保存

        // ロールに基づいて適切なページにリダイレクト
        // ただし、既にそのページにいる場合はリダイレクトしないようにする
        const currentPath = window.location.pathname;
        if (decoded.role === 'child' && !currentPath.startsWith('/chat')) {
          router.replace('/chat');
        } else if (decoded.role === 'parent' && !currentPath.startsWith('/children')) {
          router.replace('/children');
        } else if (decoded.role === 'admin' && !currentPath.startsWith('/admin')) {
          router.replace('/admin/users');
        } else {
          // 適切なロールベースのリダイレクト先がない、またはすでにそのページにいる場合
          setReady(true);
        }

      } catch (err) {
        console.error('トークン解析エラー:', err);
        // 無効なトークンの場合、Cookieを削除してログインページへ
        document.cookie = 'token=; Max-Age=0; path=/;';
        const redirectTo = encodeURIComponent(window.location.pathname);
        router.replace(`/login?redirectTo=${redirectTo}`);
      }
    }
  }, [router]);

  return ready;
}
