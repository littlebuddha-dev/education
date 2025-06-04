// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/app/admin/users/page.js
'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/lib/useAuthGuard'; // useAuthGuard をインポート
import { getCookie } from '@/utils/authUtils'; // getCookieをインポート

export default function AdminUsersPage() {
  const ready = useAuthGuard(); // useAuthGuard を呼び出す
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null); // tokenInfo はNavbarの表示には必要だが、認証ロジックからは切り離す
  const router = useRouter();

  useEffect(() => {
    if (!ready) {
      // useAuthGuard が認証処理中の場合、何もしないで待機
      return;
    }

    const token = getCookie('token');
    if (!token) {
      // useAuthGuard がリダイレクトしなかった場合（稀なケース）、エラーメッセージを設定
      setErrorMessage('ログイン情報がありません。');
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
      setTokenInfo(decoded); // デコードした情報を保存
    } catch (err) {
      console.error('トークン解析エラー:', err);
      setErrorMessage('認証情報が不正です。');
      // ここでリダイレクトはuseAuthGuardに任せる
      return;
    }

    // ロールがadminでない場合、エラーメッセージを設定（リダイレクトはuseAuthGuardに任せる）
    if (decoded.role !== 'admin') {
      setErrorMessage('⚠️ このページは管理者のみアクセス可能です');
      return;
    }

    // 管理者ロールの場合のみユーザーデータをフェッチ
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
  }, [ready]); // ready が変更されたときに再実行

  const handleDelete = async (id) => {
    if (!confirm('このユーザーを本当に削除しますか？')) return;

    const token = getCookie('token');
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

      {ready && !errorMessage && users.length > 0 && ( // ready が true になってから表示
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
              <tr key={user.id}><td>{user.last_name} {user.first_name}</td>
                <td>{user.email}</td>
                <td>{user.role === 'child' ? '子ども' : user.role === 'parent' ? '保護者' : '管理者'}</td>
                <td>
                  <div>{user.children_count}人</div>
                  <div style={{ fontSize: '0.9em', color: '#555' }}>
                    {user.children?.length > 0 &&
                      user.children.map(child => (
                        <div key={child.id}>
                          {/* children.id で直接詳細ページへリンク */}
                          <a href={`/children/${child.id}`} style={{ color: '#0070f3', textDecoration: 'underline' }}>
                            {child.name}
                          </a>
                        </div>
                      ))
                    }
                    {/* 子どもが自分自身のアカウントの場合 */}
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

                  {/* ロールが 'parent' または 'child' の場合のみスキル統計リンク */}
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
      )}

      {ready && !errorMessage && users.length === 0 && (
        <p>ユーザーがまだ登録されていません。</p>
      )}
    </main>
  );
}
