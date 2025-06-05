// src/app/children/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SkillLogForm from '@/components/SkillLogForm';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from '@/utils/authUtils';

export default function ChildDetailPage() {
  const params = useParams();
  const childId = params.id; // Still get it here

  const [child, setChild] = useState(null);
  const [skillLogs, setSkillLogs] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [error, setError] = useState('');
  const [currentUserInfo, setCurrentUserInfo] = useState(null);

  useEffect(() => {
    // Ensure childId is valid before proceeding
    if (!childId) { // 💡 修正: childId が undefined や null の場合は何もしない
        console.log('🐞 ChildDetailPage: childId is undefined, waiting for params to be ready.');
        return;
    }

    const token = getCookie('token');
    if (!token) {
      setError('ログインしていません。');
      return;
    }

    let decodedToken = null;
    try {
      decodedToken = jwtDecode(token);
      setCurrentUserInfo(decodedToken);
    } catch (err) {
      setError('認証情報が不正です。再ログインしてください。');
      document.cookie = 'token=; Max-Age=0; path=/';
      return;
    }


    // 子ども情報を取得
    fetch(`/api/children?id=${childId}`, { // childId now guaranteed to be defined
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
            if (decodedToken.role === 'admin' || foundChild.user_id === decodedToken.id || foundChild.child_user_id === decodedToken.id) {
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

    // These calls will now also wait for childId to be defined
    fetchSkills();
    fetchLearningProgress();
  }, [childId]); // Keep childId as a dependency

  const fetchSkills = () => {
    const token = getCookie('token');
    if (!token) return;

    // fetch call inside fetchSkills will now use a defined childId
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
    const token = getCookie('token');
    if (!token) return;

    // fetch call inside fetchLearningProgress will now use a defined childId
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

  if (error) return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!child || !currentUserInfo) return <main style={{ padding: '2rem' }}><p>読み込み中...</p></main>;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{child.name} さんの学習履歴</h1>
      <p>誕生日: {child.birthday}</p>
      <p>性別: {child.gender}</p>

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

      {child && (currentUserInfo.role === 'parent' || (currentUserInfo.role === 'child' && child.child_user_id === currentUserInfo.id)) && (
        <SkillLogForm childId={childId} onSuccess={fetchSkills} />
      )}
    </main>
  );
}
