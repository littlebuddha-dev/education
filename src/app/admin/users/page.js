// src/app/admin/users/page.js
'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null); // ✅ 正しい位置
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const decoded = jwtDecode(token);
    setTokenInfo(decoded); // ✅ 保存しておく

    if (decoded.role !== 'admin') {
      setErrorMessage('⚠️ このページは管理者のみアクセス可能です');
      return;
    }

    fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '取得エラー');
        }
        return res.json();
      })
      .then(setUsers)
      .catch(err => {
        console.error('Fetch error:', err.message);
        setErrorMessage(err.message);
      });
  }, []);

  // ✅ 削除処理（中に置く）
  const handleDelete = async (id) => {
    if (!confirm('このユーザーを本当に削除しますか？')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
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

  return (
    <main style={{ padding: '2rem' }}>
      <h1>ユーザー管理（管理者専用）</h1>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {users.length > 0 && (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>氏名</th>
              <th>メールアドレス</th>
              <th>ロール</th>
              <th>子ども</th>
              <th>作成日</th>
              <th>ID</th>
              <th>操作</th> {/* '統計を見る' と '操作' の列を統合し、'操作' のみにまとめる */}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.last_name} {user.first_name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
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
                  </div>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>

                <td style={{ fontSize: '0.8em', color: '#888' }}>{user.id}</td>
                
                {/* 冗長な削除ボタンを削除し、操作列に統合 */}
                <td>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={user.id === tokenInfo?.id}
                    style={{ backgroundColor: 'red', color: 'white', padding: '0.3rem 0.5rem', marginRight: '0.5rem' }}
                  >
                    削除
                  </button>

                  {/* ✅ スキル統計リンク追加 */}
                  <a
                    href={`/admin/users/${user.id}/skills`}
                    style={{ backgroundColor: '#444', color: 'white', padding: '0.3rem 0.5rem', textDecoration: 'none' }}
                  >
                    統計を見る
                  </a>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      )}

      {users.length === 0 && !errorMessage && (
        <p>ユーザーがまだ登録されていません。</p>
      )}
    </main>
  );
}
