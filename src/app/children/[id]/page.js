// src/app/children/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SkillLogForm from '@/components/SkillLogForm';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from '@/utils/authUtils';

export default function ChildDetailPage() {
  const params = useParams();
  const childId = params.id; // Get childId from params

  const [child, setChild] = useState(null);
  const [skillLogs, setSkillLogs] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [error, setError] = useState('');
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [readyToFetch, setReadyToFetch] = useState(false); // 💡 新しい状態: フェッチ準備完了フラグ

  console.log('🐞 ChildDetailPage: Render cycle - params:', params, 'childId:', childId);

  // 最初の useEffect: childId の可用性と認証状態を確認し、readyToFetch を設定
  useEffect(() => {
    console.log('🐞 ChildDetailPage: First useEffect triggered - params:', params, 'childId:', childId);

    // childId が有効でない場合は、API フェッチの準備ができていない
    if (!childId) {
        console.log('🐞 ChildDetailPage: childId is undefined/null in first useEffect, not ready to fetch yet.');
        setReadyToFetch(false); // childId が準備できていない場合はフラグを false に
        return; // useEffect をここで終了
    }

    // childId が定義された場合、API フェッチの準備ができたとマーク
    // (readyToFetch がまだ false の場合のみ更新して、無限ループを防ぐ)
    if (childId && !readyToFetch) {
        setReadyToFetch(true);
        console.log('🐞 ChildDetailPage: childId is now defined, setting readyToFetch to true.');
    }

    const token = getCookie('token');
    if (!token) {
      setError('ログインしていません。');
      setReadyToFetch(false); // トークンがない場合も準備はできていない
      return;
    }

    let decodedToken = null;
    try {
      decodedToken = jwtDecode(token);
      setCurrentUserInfo(decodedToken);
    } catch (err) {
      setError('認証情報が不正です。再ログインしてください。');
      document.cookie = 'token=; Max-Age=0; path=/';
      setReadyToFetch(false); // 無効なトークンも準備はできていない
      return;
    }

    // ここでは API コールは行わない。readyToFetch に依存する別の useEffect で行う。
  }, [childId, readyToFetch]); // childId と readyToFetch を依存配列に追加

  // 2つ目の useEffect: データフェッチロジック。readyToFetch が true になったときにのみ実行
  useEffect(() => {
    // readyToFetch が false、または currentUserInfo がまだない場合は何もしない
    if (!readyToFetch || !currentUserInfo) {
      console.log('🐞 ChildDetailPage: Second useEffect (Data fetch): Not ready to fetch or currentUserInfo missing.');
      return;
    }
    console.log('🐞 ChildDetailPage: Second useEffect (Data fetch): Ready to fetch!');

    const token = getCookie('token'); // 念のためトークンを再取得 (state にあるはずだが、防御的なチェック)
    if (!token) {
      setError('ログイン情報がありません (再確認)。');
      return;
    }

    // 子ども情報を取得
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
            if (currentUserInfo.role === 'admin' || foundChild.user_id === currentUserInfo.id || foundChild.child_user_id === currentUserInfo.id) {
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

    // スキルと学習進捗のフェッチも、この条件ブロック内で呼び出す
    fetchSkills();
    fetchLearningProgress();

  }, [readyToFetch, childId, currentUserInfo]); // readyToFetch, childId, currentUserInfo を依存配列に追加

  // fetchSkills と fetchLearningProgress 関数は useEffect の外で定義するが、
  // 呼び出しは上記の readyToFetch が true になる useEffect 内で行われる
  const fetchSkills = () => {
    const token = getCookie('token');
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
    const token = getCookie('token');
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

  // データの読み込み中表示。child, currentUserInfo, readyToFetch の全てが揃うまで表示する。
  if (error) return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!child || !currentUserInfo || !readyToFetch) return <main style={{ padding: '2rem' }}><p>読み込み中...</p></main>;

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
