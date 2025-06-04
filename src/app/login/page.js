// src/app/login/page.js
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { setAuthCookie, getCookie } from '@/utils/authUtils';
import { jwtDecode } from 'jwt-decode';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 既にログイン済みの場合は適切なページにリダイレクト
  useEffect(() => {
    const token = getCookie('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('ログインページ: 既にログイン済み、リダイレクト:', decoded.role);
        
        let targetPath;
        if (decoded.role === 'child') {
          targetPath = '/chat';
        } else if (decoded.role === 'parent') {
          targetPath = '/children';
        } else if (decoded.role === 'admin') {
          targetPath = '/admin/users';
        } else {
          targetPath = '/';
        }
        
        router.replace(targetPath);
      } catch (err) {
        console.error('ログインページ: 無効なトークン:', err);
        // 無効なトークンは削除
        document.cookie = 'token=; Max-Age=0; path=/;';
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('ログイン試行:', { email, redirectTo });

      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('ログインAPIレスポンス:', res.status, data);

      if (res.ok && data.token) {
        console.log('ログイン成功、Cookieを設定');
        
        // Cookieにトークンを設定
        setAuthCookie(data.token);

        // トークンを検証
        const decoded = jwtDecode(data.token);
        console.log('ユーザー情報:', decoded);

        // リダイレクト先を決定
        let targetPath;
        if (redirectTo && redirectTo !== '/login') {
          // redirectToが指定されており、/loginでない場合はそこにリダイレクト
          targetPath = redirectTo;
        } else {
          // ロールに基づくデフォルトリダイレクト
          if (decoded.role === 'child') {
            targetPath = '/chat';
          } else if (decoded.role === 'parent') {
            targetPath = '/children';
          } else if (decoded.role === 'admin') {
            targetPath = '/admin/users';
          } else {
            targetPath = '/';
          }
        }

        console.log('リダイレクト先:', targetPath);

        // 小さな遅延を入れてCookieが確実に設定されるようにする
        setTimeout(() => {
          router.push(targetPath);
        }, 100);

      } else {
        console.error('ログイン失敗:', data);
        setError(data.error || data.message || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error('ログインエラー:', err);
      setError('通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>ログイン</h1>
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffebee', 
          padding: '1rem', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            メールアドレス:
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="example@example.com"
              required 
              disabled={isLoading}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                marginTop: '0.25rem',
                opacity: isLoading ? 0.7 : 1
              }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>
            パスワード:
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="パスワードを入力"
              required 
              disabled={isLoading}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                marginTop: '0.25rem',
                opacity: isLoading ? 0.7 : 1
              }}
            />
          </label>
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
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="/users/register" style={{ color: '#0070f3' }}>
          アカウントをお持ちでない方はこちら
        </a>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '2rem', 
          fontSize: '0.8em', 
          color: '#666',
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px'
        }}>
          <strong>デバッグ情報:</strong>
          <br />リダイレクト先: {redirectTo || '(なし)'}
          <br />現在のCookie: {getCookie('token') ? '設定済み' : '未設定'}
        </div>
      )}
    </main>
  );
}