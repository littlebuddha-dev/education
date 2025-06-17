// src/app/admin/users/skills/page.js
// タイトル: 管理者向けスキル統計ページ（修正版）
// 役割: useAuthコンテキストを利用して認証を安定化させる
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // 共通のuseAuthフックをインポート

export default function AdminUserSkillsStatsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // 認証コンテキストから、ユーザー情報、トークン、認証状態、ローディング状態を取得
  const { user, token, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');
  const [targetUserName, setTargetUserName] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const targetUserId = searchParams.get('id');

    // 1. AuthContextの認証情報読み込みを待つ
    if (isAuthLoading) {
      return;
    }

    // 2. 認証されていなければログインページへ
    if (!isAuthenticated) {
      const redirectTo = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?redirectTo=${redirectTo}`);
      return;
    }

    // 3. 管理者でなければエラー表示
    if (user?.role !== 'admin') {
      setError('⚠️ 管理者のみ閲覧可能です');
      setIsFetching(false);
      return;
    }

    // 4. 対象ユーザーIDがなければエラー表示
    if (!targetUserId) {
      setError('対象のユーザーIDが指定されていません。');
      setIsFetching(false);
      return;
    }

    setTargetUserName(`ユーザーID: ${targetUserId}`);

    // 5. 認証情報が確定してからデータ取得APIを叩く
    fetch(`/api/admin/users/${targetUserId}/skills`, {
      headers: { Authorization: `Bearer ${token}` } // コンテキストから取得したトークンを使用
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || '統計データの取得エラー');
        }
        return res.json();
      })
      .then(data => {
        setStats(data);
        setError('');
      })
      .catch(err => {
        console.error('Fetch error for user skills stats:', err.message);
        setError(err.message);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [isAuthLoading, isAuthenticated, user, token, router, searchParams]);

  // ローディング中の表示
  if (isAuthLoading || isFetching) {
    return <main style={{ padding: '2rem' }}><p>読み込み中...</p></main>;
  }

  // 子どもごとに統計をグループ化
  const groupByChild = stats.reduce((acc, row) => {
    const childKey = row.child_name || `子ども (ID: ${row.child_id})`;
    acc[childKey] = acc[childKey] || [];
    acc[childKey].push(row);
    return acc;
  }, {});

  return (
    <main style={{ padding: '2rem' }}>
      <h1>スキル統計（対象: {targetUserName || 'N/A'}）</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!error && Object.keys(groupByChild).length === 0 && (
        <p>このユーザーの子どもに関する統計データはまだありません。</p>
      )}

      {Object.entries(groupByChild).map(([childName, logs]) => (
        <section key={childName} style={{ marginBottom: '2rem' }}>
          <h3>{childName}</h3>
          {logs.length > 0 ? (
            <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th>分野</th>
                  <th>平均スコア</th>
                  <th>件数</th>
                  <th>最終記録日</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={`${childName}-${log.domain}`}>
                    <td>{log.domain}</td>
                    <td>{log.avg_score}</td>
                    <td>{log.entry_count}</td>
                    <td>{new Date(log.last_recorded).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>この子どものスキルログはありません。</p>
          )}
        </section>
      ))}
      <button onClick={() => router.back()} style={{ marginTop: '1rem' }}>戻る</button>
    </main>
  );
}