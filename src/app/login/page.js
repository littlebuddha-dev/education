// src/app/login/page.js
// 修正版：ログインページ（エラーハンドリング強化・UX改善）
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ensureCookieSync } from '@/utils/cookieSync';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user, isLoading: authLoading, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 認証済みユーザーのリダイレクト
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      console.log('ログイン済みユーザーをリダイレクト');
      
      const DASHBOARD_PATHS = {
        admin: '/admin/users',
        parent: '/children',
        child: '/chat',
      };
      
      const redirectTo = searchParams.get('redirectTo');
      const defaultPath = DASHBOARD_PATHS[user.role] || '/';
      const targetPath = redirectTo || defaultPath;
      
      router.replace(targetPath);
    }
  }, [isAuthenticated, user, authLoading, router, searchParams]);

  // 認証コンテキストのエラー表示
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // 入力時にエラーをクリア
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // バリデーション
    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードを入力してください');
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('有効なメールアドレスを入力してください');
      setIsLoading(false);
      return;
    }

    try {
      console.log(`ログイン試行: ${formData.email}`);
      
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookie受信のため
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }

      if (!data.token) {
        throw new Error('認証トークンが取得できませんでした');
      }

      // 🔄 Cookie同期を強化
      ensureCookieSync(data.token);

      // 認証コンテキストにログイン情報を設定
      const loginResult = await login(data.token, data.user);
      
      if (!loginResult.success) {
        throw new Error(loginResult.error || 'ログイン処理に失敗しました');
      }

      console.log('ログイン成功、リダイレクト準備中...');
      
      // リダイレクトはuseEffectで処理される

    } catch (err) {
      console.error('ログインエラー:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 認証状態の読み込み中
  if (authLoading) {
    return (
      <main style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
        <div style={{ textAlign: 'center' }}>
          <p>認証状態を確認中...</p>
        </div>
      </main>
    );
  }

  // 認証済みの場合、リダイレクト完了まで何も表示しない
  if (isAuthenticated) {
    return null;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>ログイン</h1>
      
      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          border: '1px solid red', 
          borderRadius: '4px',
          backgroundColor: '#ffebee'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            メールアドレス:
          </label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }} 
          />
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            パスワード:
          </label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }} 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            width: '100%', 
            padding: '0.75rem',
            backgroundColor: isLoading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a href="/users/register" style={{ color: '#0070f3', textDecoration: 'none' }}>
          アカウントをお持ちでない方はこちら
        </a>
      </div>
    </main>
  );
}