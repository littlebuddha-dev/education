// /src/app/chat/page.js
// 役割: チャットページ。AuthContextとapiClientを参照するように全面的に修正。

'use client';

import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/lib/useAuthGuard';
import ChatUI from '@/components/ChatUI';
import { useEffect, useState } from 'react';
import { apiClient } from '@/utils/apiClient';

export default function ChatPage() {
  const ready = useAuthGuard();
  const { user, isLoading } = useAuth(); // ✅ Contextからユーザー情報を取得

  const [childId, setChildId] = useState(null);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // 認証情報が読み込まれるまで待機
    if (isLoading || !user) {
      return;
    }
    
    setError('');

    try {
      if (user.role === 'parent') {
        // ✅ apiClientを使用して、認証済みのリクエストを送信
        apiClient('/api/children')
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              setError(data.error);
              return;
            }
            // APIは認証ユーザーに紐づく子どもを返す
            setChildren(data);
            if (data.length > 0) {
              setChildId(data[0].id);
            } else {
              setError('チャットする子どもを登録してください。');
            }
          })
          .catch(err => {
            console.error('子ども情報取得エラー:', err);
            setError('子ども情報の取得に失敗しました。');
          });

      } else if (user.role === 'child') {
        // ✅ apiClientを使用して、自身のプロフィールを取得
        apiClient(`/api/children?child_user_id=${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              setError(data.error);
              return;
            }
            if (data.length > 0) {
              setChildId(data[0].id);
            } else {
              setError('チャット用のプロフィールが見つかりません。');
            }
          })
          .catch(err => {
            console.error('子どもプロフィール取得エラー:', err);
            setError('子どもプロフィール情報の取得に失敗しました。');
          });
      } else {
        setError('チャット機能は保護者または子どもユーザーのみが利用できます。');
      }
    } catch (err) {
      console.error('チャットページ初期化エラー:', err);
      setError('ページの読み込み中にエラーが発生しました。');
    }
  }, [isLoading, user]); // ✅ Contextから取得した情報に依存

  if (!ready || isLoading) {
    return <main style={{ padding: '2rem' }}><p>チャットを準備しています...</p></main>;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>先生とのチャット</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {user?.role === 'parent' && children.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label>
            チャットする子ども:
            <select
              value={childId || ''}
              onChange={(e) => setChildId(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.3rem' }}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {childId ? (
        <ChatUI childId={childId} />
      ) : (
        !error && <p>チャット相手を選択するか、子どもを登録してください。</p>
      )}
    </main>
  );
}