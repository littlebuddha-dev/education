// src/app/children/page.js
'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/utils/authUtils';

export default function ChildrenPage() {
  const [children, setChildren] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  // const [userId, setUserId] = useState(null); // ❌ 削除
  const router = useRouter(); // ✅ 追加

  useEffect(() => {
    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    if (!token) {
      router.push('/login'); // 未ログインならログインページへ
      return;
    }

    try {
      const decoded = jwtDecode(token);
      // setUserId(decoded.id); // ❌ 削除

      // 保護者ロールのみが子ども一覧を閲覧可能
      if (decoded.role !== 'parent') {
        setErrorMessage('⚠️ このページは保護者ユーザーのみアクセス可能です');
        return;
      }

      fetch('/api/children', { // user_id (保護者) に紐付く子ども、または紐付いていない子どもプロフィールも取得可能
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(async res => {
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'データ取得に失敗しました');
          }
          return res.json();
        })
        .then(data => {
            // 保護者ユーザーに紐付いている子ども、またはuser_idがNULLでかつchild_user_idがある子ども（紐付け可能な子ども）を表示
            const relevantChildren = data.filter(c => c.user_id === decoded.id || (c.user_id === null && c.child_user_id));
            setChildren(relevantChildren);
            if (relevantChildren.length === 0) {
                setErrorMessage('登録されている子ども、または紐付け可能な子どもがいません。');
            } else {
                setErrorMessage(''); // エラーメッセージをクリア
            }
        })
        .catch(err => {
          //console.warn('Fetch warning:', err.message);
          setChildren([]);
          setErrorMessage(err.message);
        });
    } catch (err) {
        setErrorMessage('認証情報が不正です。再ログインしてください。');
        // localStorage.removeItem('token'); // ❌ 変更
        document.cookie = 'token=; Max-Age=0; path=/;'; // ✅ Cookie削除
        router.push('/login');
    }
  }, []);

  // ✅ Cookie から値を取り出す関数 (ChatUI からコピー)
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>子ども管理</h1>

      {errorMessage && (
        <p style={{ color: 'red' }}>⚠️ {errorMessage}</p>
      )}

      {children.length > 0 && (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
                <tr>
                    <th>名前</th>
                    <th>誕生日</th>
                    <th>性別</th>
                    <th>紐付け</th> {/* ✅ 追加 */}
                    <th>操作</th> {/* ✅ 追加 */}
                </tr>
            </thead>
            <tbody>
                {children.map(child => (
                    <tr key={child.id}>
                        <td>{child.name}</td>
                        <td>{child.birthday ? new Date(child.birthday).toLocaleDateString() : '未設定'}</td>
                        <td>{child.gender || '未設定'}</td>
                        <td>
                            {child.user_id ? '紐付け済み' : (child.child_user_id ? '紐付け可能' : 'N/A')}
                        </td>
                        <td>
                            <button onClick={() => router.push(`/children/${child.id}`)}>
                                詳細を見る
                            </button>
                            {/* 紐付け可能な子どもに対して紐付けボタンを表示するなどのUIを追加可能 */}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      )}

      {/* 子ども一覧など通常の表示 */}
    </main>
  );
}
