// src/lib/useAuth.js
// タイトル: 認証情報フック
// 役割: クライアントサイドでログインユーザーのデコード済みトークン情報を手軽に取得します。

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getCookie, removeAuthCookie } from '@/utils/authUtils'; // [修正] removeAuthCookieもインポート

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getCookie('token'); // [修正] 共通関数を使用

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser(decoded); // { id, email, first_name, last_name, role, ... }
    } catch (err) {
      console.error('トークン解析エラー:', err);
      removeAuthCookie(); // [修正] 共通関数を使用
      setUser(null);
    }
  }, []);

  // [削除] このファイル内にあったgetCookie関数は削除されました

  return { user };
}