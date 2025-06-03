'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserRegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      setError('すべての項目を入力してください');
      return;
    }

    try {
      // 1. ユーザー登録
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      // 2. 登録成功 → 自動ログイン（JWT発行）
      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();

      if (loginData.token) {
        localStorage.setItem('token', loginData.token); // JWT保存
        router.push('/users');
      } else {
        setError('ログインに失敗しました');
      }
    } catch (err) {
      console.error('登録中エラー:', err);
      setError('エラーが発生しました');
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>ユーザー登録</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          姓：
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          名：
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          メールアドレス：
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          パスワード：
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={handleRegister}>登録する</button>
    </main>
  );
}
