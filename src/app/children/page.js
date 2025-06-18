// /src/app/children/page.js
// 役割: 子ども一覧ページ。管理者と保護者の両方のロールに対応するよう修正。

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // ✅ 新しい認証コンテキストを使用
import { apiClient } from '@/utils/apiClient';   // ✅ 新しいAPIクライアントを使用

export default function ChildrenPage() {
  const [children, setChildren] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth(); // ✅ Contextからユーザー情報を取得

  useEffect(() => {
    // 認証情報が読み込まれるまで待機
    if (authIsLoading) {
      return;
    }
    // 未認証の場合はログインページへリダイレクト
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 保護者・管理者以外のロールはアクセス不可
    if (user && user.role !== 'parent' && user.role !== 'admin') {
      setErrorMessage('⚠️ このページは保護者または管理者ユーザーのみアクセス可能です');
      setPageIsLoading(false);
      return;
    }

    // ユーザー情報が確定したら、データを取得
    if (user) {
      setPageIsLoading(true);
      apiClient('/api/children')
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'データ取得に失敗しました');
          }
          return res.json();
        })
        .then(data => {
          // APIはロールに応じて適切なデータを返す（管理者の場合は全件）
          setChildren(data);
          if (data.length === 0) {
              setErrorMessage('表示対象の子どもがいません。');
          } else {
              setErrorMessage('');
          }
        })
        .catch(err => {
          setChildren([]);
          setErrorMessage(err.message);
        })
        .finally(() => {
          setPageIsLoading(false);
        });
    }
  }, [user, isAuthenticated, authIsLoading, router]);

  if (authIsLoading || pageIsLoading) {
      return <main style={{ padding: '2rem' }}><p>子ども情報を読み込み中...</p></main>;
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
                    <th>ステータス</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                {children.map(child => (
                    <tr key={child.id}>
                        <td>{child.name}</td>
                        <td>{child.birthday ? new Date(child.birthday).toLocaleDateString() : '未設定'}</td>
                        <td>{child.gender || '未設定'}</td>
                        <td>
                            {child.user_id ? '保護者に紐付け済み' : (child.child_user_id ? '子どもアカウント有り' : 'プロフィールのみ')}
                        </td>
                        <td>
                            <button onClick={() => router.push(`/children/${child.id}`)}>
                                詳細を見る
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      )}
    </main>
  );
}