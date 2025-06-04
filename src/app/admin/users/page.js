// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/app/admin/users/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/lib/useAuthGuard';
// import { getCookie } from '@/utils/authUtils'; // getCookie は不要に

export default function AdminUsersPage() {
  const { ready, userRole, tokenInfo, authToken } = useAuthGuard(); // ✅ authToken を取得
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // useAuthGuardがまだ処理中、または認証/ロールチェックが完了していない場合
    if (!ready || userRole === null || !authToken) { // ✅ authToken もチェック
      return;
    }

    // useAuthGuardによって管理者ロールであることが保証されているはずだが、念のため
    if (userRole !== 'admin') {
      // このケースは本来useAuthGuardがリダイレクトすべきだが、もしここに来たらエラー
      setErrorMessage('⚠️ このページは管理者のみアクセス可能です。');
      return;
    }

    // 管理者ロールであればデータフェッチ
    // getCookieの呼び出しは不要、authTokenを直接使用
    fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${authToken}` } // ✅ authToken を使用
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
  }, [ready, userRole, authToken]); // ✅ authToken を依存関係に追加

  const handleDelete = async (id) => {
    if (!confirm('このユーザーを本当に削除しますか？')) return;

    if (!authToken) { // ✅ authToken をチェック
      alert('ログイン情報がありません。');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` } // ✅ authToken を使用
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

  if (!ready) {
    return (
      <main style={{ padding: '2rem' }}>
        <p>認証状態を確認中...</p>
      </main>
    );
  }

  // ready が true で、かつ管理者ロールでなければエラーメッセージを表示
  // この分岐はuseAuthGuardが正しく機能していれば到達しないはずだが、念のため
  if (userRole !== 'admin') {
    return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{errorMessage || 'アクセス権限がありません。'}</p></main>;
  }

  // ここに到達した場合は、管理者として認証済み
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
      ) : (
        !errorMessage && <p>ユーザーがまだ登録されていません。</p>
      )}
    </main>
  );
}
