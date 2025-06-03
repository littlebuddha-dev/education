'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

export default function ChildRegisterButton({ userId }) {
  const [canShow, setCanShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      if (decoded.id === userId && decoded.role === 'parent') {
        setCanShow(true);
      }
    } catch {
      // 無効なトークンは何もしない
    }
  }, [userId]);

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
