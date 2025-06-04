// littlebuddha-dev/education/education-main/src/components/Navbar.js
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from '@/utils/authUtils';

export default function Navbar() {
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [childProfileId, setChildProfileId] = useState(null); // ✅ 追加: 子どもプロフィールのID

  useEffect(() => {
    const token = getCookie('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setTokenInfo(decoded); // { id, email, role, first_name, last_name }

        // 子どもロールの場合、自身の children.id をフェッチ
        if (decoded.role === 'child') {
          fetch(`/api/children?child_user_id=${decoded.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(res => res.json())
          .then(data => {
            if (data.length > 0) {
              setChildProfileId(data[0].id); // 自身の子どもプロフィールIDをセット
            } else {
              console.warn('Navbar: 子どもプロフィールが見つかりません。');
            }
          })
          .catch(err => {
            console.error('Navbar: 子どもプロフィール取得エラー:', err);
          });
        }

      } catch (err) {
        // 無効なトークンの場合、Cookieを削除
        document.cookie = 'token=; Max-Age=0; path=/;';
        setTokenInfo(null);
        setChildProfileId(null);
      }
    } else {
      setTokenInfo(null);
      setChildProfileId(null);
    }
  }, []);

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/;';
    setTokenInfo(null);
    setChildProfileId(null);
    router.push('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  // getCookie 関数は authUtils.js からインポートされているため、ここでは不要です。

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#eee',
      padding: '1rem'
    }}>
      <div><a href="/">🏠 教育AIシステム</a></div>

      {tokenInfo ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>
            👤 {tokenInfo.last_name} {tokenInfo.first_name} さん（{tokenInfo.role === 'child' ? '子ども' : tokenInfo.role}）
          </span>

          {/* ロールに応じたナビゲーション */}
          {tokenInfo.role === 'parent' && (
            <>
              <a href="/admin/users">ユーザー管理</a> {/* 管理者機能のページへのリンク */}
              <a href="/children">子ども一覧</a>
              <a href="/children/register">子ども登録</a>
              <a href="/children/link">子ども紐付け</a>
            </>
          )}

          {tokenInfo.role === 'child' && (
            <>
              <a href="/chat">チャット</a>
              {/* 子どもが自身の学習履歴を見るページへのリンク */}
              {/* childProfileId が取得できたらそれを使用、なければ暫定的に chat へ */}
              {childProfileId ? (
                <>
                  <a href={`/children/${childProfileId}/page`}>学習状況</a> {/* ✅ children.id を使用 */}
                  <a href={`/children/${childProfileId}/evaluation`}>スキル評価</a> {/* ✅ children.id を使用 */}
                </>
              ) : (
                <span style={{ color: '#888' }}>学習状況 (読み込み中)</span>
              )}
            </>
          )}

          {tokenInfo.role === 'admin' && (
            <>
              <a href="/admin/users">全ユーザー管理</a>
              {/* 必要に応じて、管理者用の他のリンクも追加 */}
            </>
          )}

          <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>ログアウト</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={handleLogin}>ログイン</button>
          <a href="/users/register" style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            新規登録
          </a>
        </div>
      )}
    </nav>
  );
}
