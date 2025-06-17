// src/app/admin/users/page.js
// シンプル版：エラーが起きにくい最小構成
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return; // 認証状態の読み込み待ち

    if (!isAuthenticated || !user) {
      setError('ログインが必要です');
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      setError('管理者権限が必要です');
      return;
    }

    // ユーザー一覧を取得
    fetchUsers();
  }, [isAuthenticated, user, isLoading, router]);

  const fetchUsers = async () => {
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
    }
  };

  if (isLoading) {
    return <div style={{padding: '2rem'}}>認証状態を確認中...</div>;
  }

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
        <button onClick={fetchUsers} style={{marginTop: '1rem', marginLeft: '1rem'}}>
          再試行
        </button>
      </div>
    );
  }

  return (
    <div style={{padding: '2rem'}}>
      <h1>管理者 - ユーザー管理</h1>
      
      <div style={{marginBottom: '1rem'}}>
        <button onClick={fetchUsers} disabled={loading}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* デバッグ情報 */}
      <div style={{marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', fontSize: '0.8em'}}>
        <h3>🔍 デバッグ情報</h3>
        <p>認証状態: {isAuthenticated ? '✅ 認証済み' : '❌ 未認証'}</p>
        <p>ユーザー: {user?.email} ({user?.role})</p>
        <p>ユーザー数: {users.length}</p>
        <p>エラー: {error || 'なし'}</p>
        <p>ローディング: {loading ? 'はい' : 'いいえ'}</p>
      </div>
    </div>
  );
}