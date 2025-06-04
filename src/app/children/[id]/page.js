// src/app/children/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SkillLogForm from '@/components/SkillLogForm';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from '@/utils/authUtils';

export default function ChildDetailPage() {
  const params = useParams();
  const childId = params.id;

  const [child, setChild] = useState(null);
  const [skillLogs, setSkillLogs] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    if (!token) {
      setError('ログインしていません。');
      return;
    }

    const decoded = jwtDecode(token);

    // 子ども情報を取得
    // ここでは /api/children を利用し、idでフィルタリングしています。
    fetch(`/api/children?id=${childId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(async res => {
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '子ども情報の取得に失敗しました');
        }
        return res.json();
    })
    .then(data => {
        const foundChild = data.find(c => c.id === childId);
        if (foundChild) {
            // 権限チェック:
            // 1. ログインユーザーが管理者
            // 2. ログインユーザーがこの子どもの保護者 (user_id が一致)
            // 3. ログインユーザーがこの子ども自身 (child_user_id が一致)
            if (decoded.role === 'admin' || foundChild.user_id === decoded.id || foundChild.child_user_id === decoded.id) {
                setChild(foundChild);
            } else {
                setError('この子どもの情報を閲覧する権限がありません。');
            }
        } else {
            setError('子どもが見つかりませんでした。');
        }
    })
    .catch(err => {
        console.error('Fetch child error:', err.message);
        setError(err.message);
    });

    fetchSkills();
    fetchLearningProgress();
  }, [childId]);

  const fetchSkills = () => {
    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    if (!token) return;

    fetch(`/api/children/${childId}/skills`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'スキルログの取得に失敗しました');
        }
        return res.json();
      })
      .then(setSkillLogs)
      .catch(err => {
        console.error('Fetch skill logs error:', err.message);
        setError(err.message);
      });
  };

  const fetchLearningProgress = () => {
    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    if (!token) return;

    fetch(`/api/children/${childId}/learning-progress`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '学習進捗の取得に失敗しました');
        }
        return res.json();
      })
      .then(setLearningProgress)
      .catch(err => {
        console.error('Fetch learning progress error:', err.message);
        setError(err.message);
      });
  };

  // ✅ Cookie から値を取り出す関数 (ChatUI からコピー)
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  if (error) return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!child) return <main style={{ padding: '2rem' }}><p>読み込み中...</p></main>;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{child.name} さんの学習履歴</h1>
      <p>誕生日: {child.birthday}</p>
      <p>性別: {child.gender}</p>

      {/* ... (スキルログと学習進捗の表示は変更なし) */}
      <h2 style={{ marginTop: '2rem' }}>スキルログ</h2>
      {skillLogs.length === 0 ? (
        <p>スキルログがまだ登録されていません。</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>分野</th>
              <th>スコア</th>
              <th>記録日時</th>
            </tr>
          </thead>
          <tbody>
            {skillLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.domain}</td>
                <td>{log.score}</td>
                <td>{new Date(log.recorded_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: '2rem' }}>学習進捗</h2>
      {learningProgress.length === 0 ? (
        <p>学習目標がまだ設定されていないか、進捗データがありません。</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>目標名</th>
              <th>教科</th>
              <th>分野</th>
              <th>ステータス</th>
              <th>達成日</th>
            </tr>
          </thead>
          <tbody>
            {learningProgress.map((lp) => (
              <tr key={lp.id}>
                <td>{lp.goal_name}</td>
                <td>{lp.subject}</td>
                <td>{lp.domain}</td>
                <td>{lp.status}</td>
                <td>{lp.achieved_at ? new Date(lp.achieved_at).toLocaleDateString() : '未達成'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* スキルログフォームは、ログインしているユーザーが親か、
          または自身がチャットしている子どもの場合のみ表示 */}
      {child && (decoded.role === 'parent' || (decoded.role === 'child' && child.child_user_id === decoded.id)) && (
        <SkillLogForm childId={childId} onSuccess={fetchSkills} />
      )}
    </main>
  );
}
