// ✅ 修正版: login/page.js - Cookieベース保存 + redirectTo に対応
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ Cookieへ保存 (Secure無し、SameSite=Lax)
      document.cookie = `token=${data.token}; path=/; max-age=3600; SameSite=Lax`;
      router.push(redirectTo);
    } else {
      setError(data.message || 'ログインに失敗しました');
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>ログイン</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="メール" required /><br />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワード" required /><br />
        <button type="submit">ログイン</button>
      </form>
    </main>
  );
}
