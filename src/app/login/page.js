// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/app/login/page.js
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { setAuthCookie } from '@/utils/authUtils'; // 新しいヘルパーからsetAuthCookieをインポート
import { jwtDecode } from 'jwt-decode'; // jwtDecode をインポート

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo'); // ここはそのまま

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
      setAuthCookie(data.token); // ✅ ヘルパー関数を使用

      // ロールに基づいてリダイレクト先を決定
      try {
        const decoded = jwtDecode(data.token);
        if (decoded.role === 'child') {
          router.push(redirectTo || '/chat'); // 子どもはデフォルトでチャットページへ
        } else if (decoded.role === 'parent') {
          router.push(redirectTo || '/children'); // 親はデフォルトで子ども一覧ページへ
        } else if (decoded.role === 'admin') {
          router.push(redirectTo || '/admin/users'); // 管理者はデフォルトで管理者ユーザー一覧へ
        } else {
          router.push(redirectTo || '/'); // それ以外のロールやデフォルト
        }
      } catch (err) {
        console.error('トークン解析エラーまたはリダイレクト失敗:', err);
        router.push(redirectTo || '/'); // エラー時はとりあえずトップへ
      }

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
