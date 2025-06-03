'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export default function Navbar() {
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setTokenInfo(decoded); // { id, email, role, first_name, last_name }
      } catch (err) {
        localStorage.removeItem('token');
        setTokenInfo(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setTokenInfo(null);
    router.push('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#eee',
      padding: '1rem'
    }}>
      <div><a href="/">🏠 教育AIシステム</a></div>

      {tokenInfo ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>
            👤 {tokenInfo.last_name} {tokenInfo.first_name} さん（{tokenInfo.role}）
          </span>

          {tokenInfo.role === 'parent' && (
            <>
              <a href="/users">ユーザー</a>
              <a href="/children">子ども</a>
            </>
          )}

          {tokenInfo.role === 'admin' && (
            <>
              <a href="/admin/users">全ユーザー</a>
            </>
          )}

          <button onClick={handleLogout}>ログアウト</button>
        </div>
      ) : (
        <button onClick={handleLogin}>ログイン</button>
      )}
    </nav>
  );
}
