// src/app/admin/users/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/lib/useAuthGuard';

export default function AdminUsersPage() {
  const { ready, userRole, tokenInfo, authToken } = useAuthGuard();
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  console.log('📋 AdminUsersPage: レンダリング', { ready, userRole, hasAuthToken: !!authToken });

  useEffect(() => {
    console.log('📋 AdminUsersPage: useEffect開始', { ready, userRole, authToken: !!authToken });

    // useAuthGuardがまだ処理中、または認証/ロールチェックが完了していない場合
    if (!ready || userRole === null || !authToken) {
      console.log('📋 AdminUsersPage: 認証待ち中', { ready, userRole, hasAuthToken: !!authToken });
      return;
    }

    // useAuthGuardによって管理者ロールであることが保証されているはずだが、念のため
    if (userRole !== 'admin') {
      console.log('📋 AdminUsersPage: 管理者ロールではない', { userRole });
      setErrorMessage('⚠️ このページは管理者のみアクセス可能です。');
      return;
    }

    console.log('📋 AdminUsersPage: データフェッチ開始');

    // 管理者ロールであればデータフェッチ
    fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(async res => {
        console.log('📋 AdminUsersPage: API応答', { status: res.status, ok: res.ok });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '取得エラー');
        }
        return res.json();
      })
      .then(data => {
        console.log('📋 AdminUsersPage: データ取得成功', { userCount: data.length });
        setUsers(data);
      })
      .catch(err => {
        console.error('📋 AdminUsersPage: フェッチエラー:', err.message);
        setErrorMessage(err.message);
      });
  }, [ready, userRole, authToken]);

  const handleDelete = async (id) => {
    if (!confirm('このユーザーを本当に削除しますか？')) return;

    if (!authToken) {
      alert('ログイン情報がありません。');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(prev => prev.filter(user => user.id !== id));
      } else {
        alert(data.error || '削除に失敗しました');
      }
    } catch (err) {
      console.error('削除エラー:', err.message);
      alert('通信エラーが発生しました');
    }
  };

  console.log('📋 AdminUsersPage: レンダリング判定', { 
    ready, 
    userRole, 
    showLoading: !ready,
    showError: ready && userRole !== 'admin',
    showContent: ready && userRole === 'admin'
  });

  if (!ready) {
    console.log('📋 AdminUsersPage: ローディング表示');
    return (
      <main style={{ padding: '2rem' }}>
        <p>認証状態を確認中...</p>
        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '1rem' }}>
          デバッグ: ready={String(ready)}, userRole={userRole}, hasToken={String(!!authToken)}
        </div>
      </main>
    );
  }

  // ready が true で、かつ管理者ロールでなければエラーメッセージを表示
  if (userRole !== 'admin') {
    console.log('📋 AdminUsersPage: 権限エラー表示');
    return (
      <main style={{ padding: '2rem' }}>
        <p style={{ color: 'red' }}>{errorMessage || 'アクセス権限がありません。'}</p>
        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '1rem' }}>
          デバッグ: userRole={userRole}, tokenInfo={JSON.stringify(tokenInfo)}
        </div>
      </main>
    );
  }

  // ここに到達した場合は、管理者として認証済み
  console.log('📋 AdminUsersPage: メインコンテンツ表示');
  return (
    <main style={{ padding: '2rem' }}>
      <h1>ユーザー管理（管理者専用）</h1>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {users.length > 0 ? (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>氏名</th>
              <th>メールアドレス</th>
              <th>ロール</th>
              <th>子ども</th>
              <th>作成日</th>
              <th>ID</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.last_name} {user.first_name}</td>
                <td>{user.email}</td>
                <td>{user.role === 'child' ? '子ども' : user.role === 'parent' ? '保護者' : '管理者'}</td>
                <td>
                  <div>{user.children_count}人</div>
                  <div style={{ fontSize: '0.9em', color: '#555' }}>
                    {user.children?.length > 0 &&
                      user.children.map(child => (
                        <div key={child.id}>
                          <a href={`/children/${child.id}`} style={{ color: '#0070f3', textDecoration: 'underline' }}>
                            {child.name}
                          </a>
                        </div>
                      ))
                    }
                    {user.role === 'child' && user.children_count === 0 && user.children?.[0]?.id && (
                        <div>
                            <a href={`/children/${user.children[0].id}`} style={{ color: '#0070f3', textDecoration: 'underline' }}>
                                (自身)
                            </a>
                        </div>
                    )}
                  </div>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td style={{ fontSize: '0.8em', color: '#888' }}>{user.id}</td>
                <td>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={user.id === tokenInfo?.id}
                    style={{ backgroundColor: 'red', color: 'white', padding: '0.3rem 0.5rem', marginRight: '0.5rem' }}
                  >
                    削除
                  </button>
                  {(user.role === 'parent' || user.role === 'child') && (
                    <a
                      href={`/admin/users/${user.id}/skills`}
                      style={{ backgroundColor: '#444', color: 'white', padding: '0.3rem 0.5rem', textDecoration: 'none' }}
                    >
                      統計を見る
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !errorMessage && <p>ユーザーがまだ登録されていません。</p>
      )}

      <div style={{ 
        marginTop: '2rem', 
        fontSize: '0.8em', 
        color: '#666',
        backgroundColor: '#f5f5f5',
        padding: '1rem',
        borderRadius: '4px'
      }}>
        <strong>デバッグ情報:</strong>
        <br />Ready: {String(ready)}
        <br />UserRole: {userRole}
        <br />HasAuthToken: {String(!!authToken)}
        <br />UsersCount: {users.length}
        <br />TokenInfo: {JSON.stringify(tokenInfo, null, 2)}
      </div>
    </main>
  );
}