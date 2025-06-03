// src/lib/useAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser(decoded); // { id, email, first_name, last_name, role, ... }
    } catch (err) {
      console.error('トークン解析エラー:', err);
      // localStorage.removeItem('token'); // ❌ 変更
      document.cookie = 'token=; Max-Age=0; path=/;'; // ✅ Cookie削除
      setUser(null);
    }
  }, []);

  // ✅ Cookie から値を取り出す関数 (ChatUI からコピー)
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  return { user };
}
