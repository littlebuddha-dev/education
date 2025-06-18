// /src/app/login/page.js
// 役割: ログインページ（最終版）。成功後に自動でリダイレクトする。

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅【最終修正】ログイン後の自動リダイレクト処理を元に戻します
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirectTo = searchParams.get('redirectTo') || '/admin/users';
      router.replace(redirectTo);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ログインに失敗しました');
      
      await login(data.accessToken, data.user);

    } catch (err) {
      setError(err.message);
      setIsSubmitting(false); // エラー時に再度ボタンを押せるようにする
    }
    // isSubmittingはリダイレクトが発生するため、ここではfalseに戻しません
  };
  
  // ✅【最終修正】認証チェック中やリダイレクト待機中はローディング画面を表示
  if (authLoading || isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <p>ユーザー情報読み込み中...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>ログイン</h1>
      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', border: '1px solid red', borderRadius: '4px', backgroundColor: '#ffebee' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>メールアドレス:</label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>パスワード:</label>
          <input type="password" name="password" value={formData.password} onChange={handleInputChange} required disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }} />
        </div>
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem', backgroundColor: isSubmitting ? '#ccc' : '#0070f3', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a href="/users/register" style={{ color: '#0070f3', textDecoration: 'none' }}>アカウントをお持ちでない方はこちら</a>
      </div>
    </main>
  );
}