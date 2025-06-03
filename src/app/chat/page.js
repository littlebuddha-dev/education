// littlebuddha-dev/education/education-main/src/app/chat/page.js
'use client';

import { useAuthGuard } from '@/lib/useAuthGuard';
import ChatUI from '@/components/ChatUI';
import { useEffect, useState } from 'react'; // ✅ 追加
import { jwtDecode } from 'jwt-decode'; // ✅ 追加

export default function ChatPage() {
  const ready = useAuthGuard();
  const [childId, setChildId] = useState(null); // ✅ 追加
  const [children, setChildren] = useState([]); // ✅ 追加
  const [error, setError] = useState(''); // ✅ 追加

  // ✅ ログイン中の保護者の子ども一覧を取得
  useEffect(() => {
    if (!ready) return; // AuthGuardが完了してから実行

    const token = localStorage.getItem('token');
    if (!token) {
      setError('ログイン情報がありません。');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role === 'parent') {
        fetch('/api/children', { // 保護者の子ども一覧を取得するAPIを呼び出し
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              setError(data.error);
              return;
            }
            setChildren(data);
            if (data.length > 0) {
              setChildId(data[0].id); // デフォルトで最初の子どもを選択
            } else {
              setError('登録されている子どもがいません。子どもを登録してください。');
            }
          })
          .catch(err => {
            console.error('子ども情報取得エラー:', err);
            setError('子ども情報の取得に失敗しました。');
          });
      } else {
        setError('チャット機能は保護者ユーザーのみが利用できます。');
      }
    } catch (err) {
      console.error('トークン解析エラー:', err);
      setError('認証情報が不正です。再ログインしてください。');
    }
  }, [ready]); // ready が変更されたときに実行

  if (!ready) return null;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>先生とのチャット</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* エラー表示 */}

      {/* 子ども選択ドロップダウン（保護者かつ子どもがいる場合のみ表示） */}
      {children.length > 0 && (
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

      {childId && <ChatUI childId={childId} />} {/* ✅ childId を ChatUI に渡す */}
      {!childId && children.length === 0 && !error && <p>チャットを開始するには、まず子どもを登録してください。</p>} {/* 子どもがいない場合のメッセージ */}
    </main>
  );
}
