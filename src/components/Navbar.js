// /src/components/Navbar.js
// 役割: ナビゲーションバー。認証状態に応じて表示を切り替える。

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import ClientOnly from './ClientOnly';
import { apiClient } from '@/utils/apiClient'; // ✅ apiClient をインポート

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const [childProfileId, setChildProfileId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 子ども自身のプロフィールIDを取得
  useEffect(() => {
    if (!user || user.role !== 'child' || !isAuthenticated) {
      setChildProfileId(null);
      return;
    }
    const fetchChildProfile = async () => {
      try {
        // ✅ apiClient を使用して認証ヘッダーを自動付与
        const response = await apiClient(`/api/children?child_user_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setChildProfileId(data[0].id);
          }
        } else {
          console.error('子どもプロフィールの取得に失敗しました。');
        }
      } catch (error) {
        console.error('子どもプロフィール取得エラー:', error);
      }
    };
    fetchChildProfile();
  }, [user, isAuthenticated]);
  
  // ドロップダウンの外側をクリックしたときに閉じる処理
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleLogout = () => {
    if (logout) {
      logout();
    }
  };

  const getRoleDisplayName = (role) => ({
    admin: '管理者', parent: '保護者', child: '子ども'
  }[role] || '不明');

  // スタイル定義（変更なし）
  const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1rem 2rem', borderBottom: '1px solid #ddd', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
  const logoStyle = { fontSize: '1.2em', fontWeight: 'bold', color: 'white', textDecoration: 'none' };
  const navLinkStyle = { color: 'white', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', transition: 'background-color 0.2s', fontSize: '0.9em' };
  const navButtonStyle = { ...navLinkStyle, border: 'none', fontFamily: 'inherit', cursor: 'pointer', background: 'rgba(255,255,255,0.1)' };
  const logoutButtonStyle = { padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,0.3)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', transition: 'background-color 0.2s' };
  const loginButtonStyle = { padding: '0.5rem 1rem', backgroundColor: 'white', color: '#667eea', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', fontWeight: 'bold' };
  const registerLinkStyle = { padding: '0.5rem 1rem', backgroundColor: '#ff6b6b', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '0.9em', fontWeight: 'bold' };
  const dropdownMenuStyle = { position: 'absolute', top: '120%', right: 0, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '160px', overflow: 'hidden', border: '1px solid #eee' };
  const dropdownLinkStyle = { display: 'block', padding: '0.8rem 1.2rem', color: '#333', textDecoration: 'none', fontSize: '0.9em', cursor: 'pointer' };

  return (
    <nav style={navStyle}>
      <div style={logoStyle}>
        <Link href="/" style={logoStyle}>🏠 教育AIシステム</Link>
      </div>
      
      <ClientOnly>
        {isLoading ? (
          <div style={{ fontSize: '0.9em', color: 'white' }}>認証状態確認中...</div>
        ) : isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.9em' }}>
              👤 {user.lastName} {user.firstName} さん ({getRoleDisplayName(user.role)})
            </span>
            {user.role === 'admin' && (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(p => !p)} style={navButtonStyle}>管理メニュー ▼</button>
                {isDropdownOpen && (
                  <div style={dropdownMenuStyle} onClick={() => setIsDropdownOpen(false)}>
                    <Link href="/admin/users"><span style={dropdownLinkStyle}>👥 ユーザー管理</span></Link>
                    <Link href="/children"><span style={dropdownLinkStyle}>👶 子ども管理</span></Link>
                    <Link href="/chat"><span style={dropdownLinkStyle}>💬 チャット</span></Link>
                  </div>
                )}
              </div>
            )}
            {user.role === 'parent' && (
              <>
                <Link href="/children" style={navLinkStyle}>👶 子ども一覧</Link>
                <Link href="/children/register" style={navLinkStyle}>➕ 子ども登録</Link>
                <Link href="/chat" style={navLinkStyle}>💬 チャット</Link>
              </>
            )}
            {user.role === 'child' && (
              <>
                <Link href="/chat" style={navLinkStyle}>💬 チャット</Link>
                {childProfileId && <Link href={`/children/${childProfileId}`} style={navLinkStyle}>📊 学習状況</Link>}
              </>
            )}
            <button onClick={handleLogout} style={logoutButtonStyle}>ログアウト</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/login"><button style={loginButtonStyle}>ログイン</button></Link>
            <Link href="/users/register" style={registerLinkStyle}>
                新規登録
            </Link>
          </div>
        )}
      </ClientOnly>
    </nav>
  );
}