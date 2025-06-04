// src/components/ChildRegisterButton.js
'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/utils/authUtils';

export default function ChildRegisterButton({ userId }) {
  const [canShow, setCanShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      // 親のuser_idと一致し、かつ親ロールの場合のみ表示
      if (decoded.id === userId && decoded.role === 'parent') {
        setCanShow(true);
      }
    } catch {
      // 無効なトークンは何もしない
    }
  }, [userId]);

  // ✅ Cookie から値を取り出す関数 (ChatUI からコピー)
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  if (!canShow) return null;

  return (
    <button
      onClick={() => router.push('/children/register')}
      style={{
        marginTop: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '5px'
      }}
    >
      👶 子どもを登録する
    </button>
  );
}