// littlebuddha-dev/education/education-main/src/app/chat/page.js
'use client';

import { useAuthGuard } from '@/lib/useAuthGuard';
import ChatUI from '@/components/ChatUI';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export default function ChatPage() {
  const ready = useAuthGuard();
  const [childId, setChildId] = useState(null);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null); // ✅ 追加: ユーザーロール

  // Cookieからトークンを取得するヘルパー関数 (このファイルにも追加)
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  useEffect(() => {
    if (!ready) return;

    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    if (!token) {
      setError('ログイン情報がありません。');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role); // ✅ ロールを保存

      if (decoded.role === 'parent') {
        fetch('/api/children', {
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
            // 保護者ユーザーの子どもリストは user_id に紐付くものを取得
            const parentChildren = data.filter(c => c.user_id === decoded.id);
            setChildren(parentChildren);
            if (parentChildren.length > 0) {
              setChildId(parentChildren[0].id);
            } else {
              setError('登録されている子どもがいません。子どもを登録してください。');
            }
          })
          .catch(err => {
            console.error('子ども情報取得エラー:', err);
            setError('子ども情報の取得に失敗しました。');
          });
      } else if (decoded.role === 'child') {
        // 'child' ロールの場合、自身の children.id を取得
        fetch(`/api/children?child_user_id=${decoded.id}`, { // 新しいAPIクエリパラメータを想定
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
            if (data.length > 0) {
              setChildId(data[0].id); // 自身の子どもプロフィールIDをセット
            } else {
              setError('子どもプロフィール情報が見つかりません。管理者にお問い合わせください。');
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
      console.error('トークン解析エラー:', err);
      setError('認証情報が不正です。再ログインしてください。');
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>先生とのチャット</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* 保護者の場合のみ子ども選択ドロップダウンを表示 */}
      {userRole === 'parent' && children.length > 0 && ( // ✅ userRole のチェックを追加
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

      {childId && <ChatUI childId={childId} />}
      {/* 保護者の場合で子どもがいないか、子どもの場合でプロフィールが見つからない場合 */}
      {!childId && (userRole === 'parent' && children.length === 0) && !error && <p>チャットを開始するには、まず子どもを登録してください。</p>}
      {!childId && userRole === 'child' && !error && <p>チャットを開始するための子どもプロフィール情報が見つかりません。</p>}
    </main>
  );
}
