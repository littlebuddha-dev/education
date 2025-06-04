// littlebuddha-dev/education/education-main/src/components/Navbar.js
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from '@/utils/authUtils';

export default function Navbar() {
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    // JWTがlocalStorageではなくCookieから取得されるように変更
    const token = getCookie('token'); // ✅ getCookie 関数を使用
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setTokenInfo(decoded); // { id, email, role, first_name, last_name }
      } catch (err) {
        // 無効なトークンの場合、Cookieを削除
        document.cookie = 'token=; Max-Age=0; path=/;'; // ✅ Cookie削除
        setTokenInfo(null);
      }
    }
  }, []);

  const handleLogout = () => {
    // localStorage の token を削除する代わりに Cookie を削除
    document.cookie = 'token=; Max-Age=0; path=/;'; // ✅ Cookie削除
    setTokenInfo(null);
    router.push('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  // ✅ Cookie から値を取り出す関数 (ChatUIからコピー)
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

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
              <a href="/users">ユーザー管理</a> {/* ✅ リンクテキスト変更 */}
              <a href="/children">子ども一覧</a> {/* ✅ リンクテキスト変更 */}
              <a href="/children/register">子ども登録</a> {/* ✅ 追加 */}
              <a href="/children/link">子ども紐付け</a>
            </>
          )}

          {tokenInfo.role === 'child' && (
            <>
              <a href="/chat">チャット</a>
              {/* 子どもが自身の学習履歴を見るページへのリンク */}
              {/* 子どもは自分の children.id をNavbarで直接取得できないため、一旦 /children/自分のuser_id/skills とする */}
              {/* 理想的には、/children/[id]/skills の [id] が children.id に対応する API を作成し、
                 NavbarではAPIを叩いてchildren.idを取得してからリダイレクトするべきです。
                 しかし、ここでは簡易的に users.id を使ってリンクを生成します。
                 user.id と children.id が異なる場合、このリンクは機能しない可能性がありますので注意してください。 */}
              <a href={`/children/${tokenInfo.id}/skills`}>学習状況</a> {/* 仮のリンク、children.id に修正必要 */}
              <a href={`/children/${tokenInfo.id}/evaluation`}>スキル評価</a> {/* ✅ 追加 */}
            </>
          )}

          {tokenInfo.role === 'admin' && (
            <>
              <a href="/admin/users">全ユーザー管理</a> {/* ✅ リンクテキスト変更 */}
              {/* 必要に応じて、管理者用の他のリンクも追加 */}
            </>
          )}

          <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>ログアウト</button> {/* ✅ スタイル調整 */}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}> {/* ✅ 未ログイン時のボタンもdivで囲む */}
          <button onClick={handleLogin}>ログイン</button>
          <a href="/users/register" style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            新規登録
          </a>
        </div>
      )}
    </nav>
  );
}