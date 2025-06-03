// src/lib/useAuthGuard.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getCookie('token');
    if (!token) {
      const redirectTo = encodeURIComponent(window.location.pathname);
      router.replace(`/login?redirectTo=${redirectTo}`);
    } else {
      setReady(true);
    }
  }, [router]);

  return ready;
}

// ✅ Cookie からトークンを取得する関数
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}
