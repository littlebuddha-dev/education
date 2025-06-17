// src/components/Navbar.js
// 修正版：ナビゲーションバー（認証状態管理改善・エラーハンドリング強化）
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading, error } = useAuth();
  const [childProfileId, setChildProfileId] = useState(null);
  const [isLoadingChild, setIsLoadingChild] = useState(false);

  // 子ども自身のプロフィールIDを取得
  useEffect(() => {
    if (!user || user.role !== 'child' || !isAuthenticated) {
      setChildProfileId(null);
      return;
    }

    const fetchChildProfile = async () => {
      setIsLoadingChild(true);
      try {
        const response = await fetch(`/api/children?child_user_id=${user.id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setChildProfileId(data[0].id);
          }
        } else {
          console.error('子どもプロフィール取得失敗:', response.status);
        }
      } catch (error) {
        console.error('子どもプロフィール取得エラー:', error);
      } finally {
        setIsLoadingChild(false);
      }
    };

    fetchChildProfile();
  }, [user, isAuthenticated]);

  const handleLogout = () => {
    try {
      logout();
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラーが発生してもログインページに遷移
      router.push('/login');
    }
  };

  const renderAuthenticatedNav = () => {
    const displayName = user.last_name && user.first_name 
      ? `${user.last_name} ${user.first_name}` 
      : user.email;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ 
          padding: '0.5rem', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px',
          fontSize: '0.9em'
        }}>
          👤 {displayName} さん ({getRoleDisplayName(user.role)})
        </span>

        {/* 管理者用ナビゲーション */}
        {user.role === 'admin' && (
          <a 
            href="/admin/users"
            style={navLinkStyle}
          >
            👥 ユーザー管理
          </a>
        )}

        {/* 保護者用ナビゲーション */}
        {user.role === 'parent' && (
          <>
            <a href="/children" style={navLinkStyle}>
              👶 子ども一覧
            </a>
            <a href="/children/register" style={navLinkStyle}>
              ➕ 子ども登録
            </a>
            <a href="/chat" style={navLinkStyle}>
              💬 チャット
            </a>
          </>
        )}

        {/* 子ども用ナビゲーション */}
        {user.role === 'child' && (
          <>
            <a href="/chat" style={navLinkStyle}>
              💬 チャット
            </a>
            {childProfileId && !isLoadingChild ? (
              <a href={`/children/${childProfileId}`} style={navLinkStyle}>
                📊 学習状況
              </a>
            ) : isLoadingChild ? (
              <span style={{ fontSize: '0.8em', color: '#666' }}>読み込み中...</span>
            ) : null}
          </>
        )}

        <button 
          onClick={handleLogout}
          style={logoutButtonStyle}
        >
          ログアウト
        </button>
      </div>
    );
  };

  const renderUnauthenticatedNav = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <a href="/login">
        <button style={loginButtonStyle}>
          ログイン
        </button>
      </a>
      <a 
        href="/users/register" 
        style={registerLinkStyle}
      >
        新規登録
      </a>
    </div>
  );

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: '管理者',
      parent: '保護者',
      child: '子ども',
    };
    return roleNames[role] || role;
  };

  // エラー表示（開発用）
  if (error && process.env.NODE_ENV === 'development') {
    console.error('Navbar認証エラー:', error);
  }

  return (
    <nav style={navStyle}>
      <div style={logoStyle}>
        <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          🏠 教育AIシステム
        </a>
      </div>

      {isLoading ? (
        <div style={{ fontSize: '0.9em', color: '#666' }}>
          認証状態確認中...
        </div>
      ) : isAuthenticated ? (
        renderAuthenticatedNav()
      ) : (
        renderUnauthenticatedNav()
      )}
    </nav>
  );
}

// スタイル定義
const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '1rem 2rem',
  borderBottom: '1px solid #ddd',
  color: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const logoStyle = {
  fontSize: '1.2em',
  fontWeight: 'bold',
};

const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  backgroundColor: 'rgba(255,255,255,0.1)',
  transition: 'background-color 0.2s',
  fontSize: '0.9em',
  ':hover': {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
};

const logoutButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9em',
  transition: 'background-color 0.2s',
};

const loginButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: 'white',
  color: '#667eea',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9em',
  fontWeight: 'bold',
};

const registerLinkStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#ff6b6b',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '4px',
  fontSize: '0.9em',
  fontWeight: 'bold',
};