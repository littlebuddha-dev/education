// src/app/page.js
// タイトル: ホームページ（Linkコンポーネントインポート修正版）
// 役割: 不足していたLinkコンポーネントをインポートし、参照エラーを解消する。
'use client';

import styles from './page.module.css';
import { useAuth } from '@/context/AuthContext';
import ClientOnly from '@/components/ClientOnly';
import Link from 'next/link'; // 【重要】この行を追加しました

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ClientOnly>
          {isLoading ? (
            <div style={{ textAlign: "center", height: '150px' }}>
              <p style={{ fontSize: '1.2em', color: '#888' }}>読み込み中...</p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <h1>教育AIシステムへようこそ！</h1>
                
                {isAuthenticated && user ? (
                  <p style={{ marginTop: '1rem', color: '#555', fontSize: '1.1em' }}>
                    {user.last_name} {user.first_name}さん、こんにちは。<br/>
                    上部のナビゲーションから各機能をご利用ください。
                  </p>
                ) : (
                  <p style={{ marginTop: '1rem', color: '#666' }}>
                    AIと共に学ぶ、新しい教育プラットフォーム。
                  </p>
                )}
              </div>

              {!isAuthenticated && (
                <div className={styles.ctas}>
                  {/* Linkコンポーネントが使えるように修正 */}
                  <Link href="/login" className={`${styles.primary} primary`}>ログイン</Link>
                  <Link href="/users/register" className={`${styles.secondary} secondary`}>新規登録</Link>
                </div>
              )}
            </>
          )}
        </ClientOnly>
      </main>
    </div>
  );
}