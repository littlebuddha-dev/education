// src/app/admin/users/page.js
// 最終版：React StrictModeの影響を完全に排除
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // React StrictMode完全対応のためのフラグ
  const initializationRef = useRef(false);
  const fetchInProgressRef = useRef(false);

  // ユーザー一覧取得関数（完全版）
  const fetchUsers = useCallback(async () => {
    // 重複実行防止
    if (loading || fetchInProgressRef.current) {
      console.log('🔄 既にローディング中のため、重複リクエストをスキップ');
      return;
    }

    fetchInProgressRef.current = true;

    try {
      setLoading(true);
      setError('');
      
      console.log('🚀 フロントエンド: ユーザー一覧取得開始');
      
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 フロントエンド: レスポンス受信', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ フロントエンド: APIエラー', errorText);
        throw new Error(`API エラー: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ フロントエンド: データ取得成功', data);
      
      setUsers(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error('❌ フロントエンド: fetchUsers エラー', err);
      setError(`ユーザー一覧の取得に失敗しました: ${err.message}`);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // 初期化処理（StrictMode完全対応版）
  useEffect(() => {
    const executionId = Math.random().toString(36).substr(2, 9);
    console.log('🔍 AdminUsersPage useEffect:', {
      isLoading,
      isAuthenticated, 
      userRole: user?.role,
      initializationRef: initializationRef.current,
      executionId
    });

    // 初期化済みチェック
    if (initializationRef.current) {
      console.log('⏭️ 既に初期化済みのため、useEffectをスキップ');
      return;
    }

    if (isLoading) {
      console.log('⏳ 認証状態の読み込み待ち');
      return;
    }

    if (!isAuthenticated || !user) {
      console.log('🔐 未認証のため、ログインページへリダイレクト');
      setError('ログインが必要です');
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      console.log('🚫 管理者権限なし');
      setError('管理者権限が必要です');
      return;
    }

    // ここで初期化フラグを設定（重複実行防止）
    initializationRef.current = true;
    console.log('✅ 認証・認可チェック通過、データ取得開始');
    
    // データ取得を即座に実行（遅延なし）
    fetchUsers();

  }, [isAuthenticated, user, isLoading, router, fetchUsers]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      // 開発環境でのHMR対応
      if (process.env.NODE_ENV === 'development') {
        initializationRef.current = false;
        fetchInProgressRef.current = false;
      }
    };
  }, []);

  // 手動更新関数
  const handleRefresh = () => {
    setError('');
    fetchUsers();
  };

  // ローディング中の表示
  if (isLoading) {
    return <div style={{padding: '2rem'}}>認証状態を確認中...</div>;
  }

  // エラー表示
  if (error) {
    return (
      <div style={{padding: '2rem'}}>
        <h1>管理者 - ユーザー管理</h1>
        <div style={{color: 'red', padding: '1rem', border: '1px solid red', marginTop: '1rem'}}>
          ❌ {error}
        </div>
        <button onClick={() => router.push('/login')} style={{marginTop: '1rem'}}>
          ログインページへ
        </button>
        <button 
          onClick={handleRefresh} 
          style={{marginTop: '1rem', marginLeft: '1rem'}}
          disabled={loading}
        >
          {loading ? '再試行中...' : '再試行'}
        </button>
      </div>
    );
  }

  return (
    <div style={{padding: '2rem'}}>
      <h1>管理者 - ユーザー管理</h1>
      
      <div style={{marginBottom: '1rem'}}>
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '読み込み中...' : 'ユーザー一覧を更新'}
        </button>
      </div>

      {loading ? (
        <p>ユーザー一覧を読み込み中...</p>
      ) : users.length === 0 ? (
        <p>ユーザーが見つかりません</p>
      ) : (
        <div>
          <p>ユーザー数: {users.length}</p>
          <table border="1" style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th style={{padding: '8px'}}>Email</th>
                <th style={{padding: '8px'}}>名前</th>
                <th style={{padding: '8px'}}>役割</th>
                <th style={{padding: '8px'}}>登録日</th>
                <th style={{padding: '8px'}}>子どもの数</th>
                <th style={{padding: '8px'}}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{padding: '8px'}}>{u.email}</td>
                  <td style={{padding: '8px'}}>{u.first_name} {u.last_name}</td>
                  <td style={{padding: '8px'}}>{u.role}</td>
                  <td style={{padding: '8px'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{padding: '8px', textAlign: 'center'}}>{u.children_count || 0}</td>
                  <td style={{padding: '8px'}}>
                    <button 
                      onClick={() => router.push(`/admin/users/${u.id}/skills`)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📊 スキル統計
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* デバッグ情報（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', fontSize: '0.8em'}}>
          <h3>🔍 デバッグ情報</h3>
          <p>認証状態: {isAuthenticated ? '✅ 認証済み' : '❌ 未認証'}</p>
          <p>ユーザー: {user?.email} ({user?.role})</p>
          <p>ユーザー数: {users.length}</p>
          <p>エラー: {error || 'なし'}</p>
          <p>ローディング: {loading ? 'はい' : 'いいえ'}</p>
          <p>初期化済み: {initializationRef.current ? 'はい' : 'いいえ'}</p>
          <p>フェッチ中: {fetchInProgressRef.current ? 'はい' : 'いいえ'}</p>
        </div>
      )}
    </div>
  );
}