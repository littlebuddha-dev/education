'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export default function ChildrenPage() {
  const [children, setChildren] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUserId(decoded.id);

      fetch('/api/children', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(async res => {
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'データ取得に失敗しました');
          }
          return res.json();
        })
        .then(setChildren)
        .catch(err => {
          //console.warn('Fetch warning:', err.message);
          setChildren([]);
          setErrorMessage(err.message);
        });
    }
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>子ども管理</h1>

      {errorMessage && (
        <p style={{ color: 'red' }}>⚠️ {errorMessage}</p>
      )}

      {/* 子ども一覧など通常の表示 */}
    </main>
  );
}
