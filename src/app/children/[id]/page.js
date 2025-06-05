// src/app/children/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // 💡 useRouter をインポート
import SkillLogForm from '@/components/SkillLogForm';
import { jwtDecode } from 'jwt-decode';
import { getCookie, removeAuthCookie } from '@/utils/authUtils'; // 💡 removeAuthCookie をインポート

export default function ChildDetailPage() {
  const params = useParams();
  const childId = params ? params.id : undefined;
  const router = useRouter(); // 💡 router を初期化

  const [child, setChild] = useState(null);
  const [skillLogs, setSkillLogs] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [error, setError] = useState('');
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [isReady, setIsReady] = useState(false); // ページがデータをフェッチする準備ができたか

  console.log('🐞 ChildDetailPage: Render cycle - params:', params, 'childId:', childId);

  // 認証とパラメータの準備を確認するuseEffect
  useEffect(() => {
    console.log('🐞 ChildDetailPage: Auth & Params Check useEffect triggered - childId:', childId);
    const token = getCookie('token');
    if (!token) {
      setError('ログインしていません。');
      setIsReady(false);
      router.push('/login'); // 💡 ログインページへリダイレクト
      return;
    }

    let decodedToken = null;
    try {
      decodedToken = jwtDecode(token);
      setCurrentUserInfo(decodedToken);
    } catch (err) {
      setError('認証情報が不正です。再ログインしてください。');
      removeAuthCookie(); // 💡 不正なトークンを削除
      setIsReady(false);
      router.push('/login'); // 💡 ログインページへリダイレクト
      return;
    }

    if (childId && decodedToken) {
        console.log('🐞 ChildDetailPage: Auth & Params OK. Setting isReady to true.');
        setIsReady(true);
    } else if (childId === undefined && params) { // params は存在するが childId が undefined の場合 (初期レンダリング時など)
        console.log('🐞 ChildDetailPage: childId is undefined, waiting for params to resolve.');
        setIsReady(false);
    } else {
        console.log('🐞 ChildDetailPage: childId or token info missing, not ready yet.');
        setIsReady(false);
    }
  }, [childId, params, router]); // 💡 params と router を依存配列に追加

  // データフェッチ用のuseEffect
  useEffect(() => {
    if (!isReady || !childId || !currentUserInfo) {
      console.log('🐞 ChildDetailPage: Data Fetch useEffect: Not ready or critical info missing.', { isReady, childId, hasCurrentUserInfo: !!currentUserInfo });
      return;
    }
    console.log('🐞 ChildDetailPage: Data Fetch useEffect: Ready to fetch data for childId:', childId);

    const token = getCookie('token'); // isReady の段階でトークンはあるはずだが念のため
    if (!token) {
      setError('ログイン情報が確認できませんでした。');
      return;
    }

    // 子ども情報を取得
    fetch(`/api/children?id=${childId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
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

    fetchSkills(token);
    fetchLearningProgress(token);

  }, [isReady, childId, currentUserInfo]);

  const fetchSkills = (token) => {
    if (!childId) {
        console.warn("fetchSkills: childId is undefined, skipping API call.");
        return;
    }
    fetch(`/api/children/${childId}/skills`, {
      headers: { 'Authorization': `Bearer ${token}` }
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
        setError(prevError => prevError || err.message);
      });
  };

  const fetchLearningProgress = (token) => {
    if (!childId) {
        console.warn("fetchLearningProgress: childId is undefined, skipping API call.");
        return;
    }
    fetch(`/api/children/${childId}/learning-progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
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
        setError(prevError => prevError || err.message);
      });
  };

  if (error) return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!isReady || !child) return <main style={{ padding: '2rem' }}><p>読み込み中...</p></main>;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{child.name} さんの学習履歴</h1>
      <p>誕生日: {child.birthday ? new Date(child.birthday).toLocaleDateString() : '未設定'}</p>
      <p>性別: {child.gender || '未設定'}</p>

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

      {currentUserInfo && child && (currentUserInfo.role === 'parent' || (currentUserInfo.role === 'child' && child.child_user_id === currentUserInfo.id)) && (
        <SkillLogForm childId={childId} onSuccess={() => fetchSkills(getCookie('token'))} />
      )}
       <button onClick={() => router.back()} style={{ marginTop: '1rem' }}>戻る</button>
    </main>
  );
}
