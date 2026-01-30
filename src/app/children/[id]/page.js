//src/app/children/[id]/page.js
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SkillLogForm from '@/components/SkillLogForm';

export default function ChildDetailPage({ params }) {
  // ✅ Next.js 15+ 対応: params は Promise なので use() で展開する
  const resolvedParams = use(params);
  const childId = resolvedParams.id;

  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. 認証ロード中は処理しない
    if (authLoading) return;

    // 2. 未認証の場合は、自動リダイレクトせず、ローディングを終了して画面表示に任せる
    // (ここで router.push するとループの原因になるため)
    if (!token) {
      setLoading(false);
      return;
    }

    if (!childId) return;

    const fetchChildData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/children', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
             throw new Error('UNAUTHORIZED');
          }
          throw new Error('データの取得に失敗しました');
        }

        const children = await res.json();
        
        // IDで対象の子どもを検索
        const foundChild = children.find(c => c.id === childId);

        if (!foundChild) {
           throw new Error('NOT_FOUND');
        }

        setChild(foundChild);

      } catch (err) {
        console.error('Child detail error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChildData();
  }, [childId, token, authLoading]);

  // ----------------------------------------------------------------
  // 画面描画ロジック
  // ----------------------------------------------------------------

  // 1. 認証情報ロード中
  if (authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500">認証情報を確認中...</p>
      </div>
    );
  }

  // 2. 未認証状態 (トークンなし) - 自動リダイレクトの代わりにボタンを表示
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full border border-gray-200">
          <p className="text-lg text-gray-800 mb-6 font-bold">ログインが必要です</p>
          <p className="text-gray-600 mb-6 text-sm">
            このページを閲覧するにはログインしてください。
          </p>
          <button 
            onClick={() => router.push(`/login?redirectTo=/children/${childId}`)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors w-full font-medium"
          >
            ログインページへ移動
          </button>
        </div>
      </div>
    );
  }

  // 3. データロード中 (認証済みだがデータ取得中)
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500">データを読み込んでいます...</p>
      </div>
    );
  }

  // 4. エラー表示
  if (error) {
    let errorTitle = 'エラーが発生しました';
    let errorMessage = error;
    let actionButton = (
      <button 
        onClick={() => router.push('/children')}
        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
      >
        子ども一覧に戻る
      </button>
    );

    if (error === 'UNAUTHORIZED') {
        errorTitle = 'セッション切れ';
        errorMessage = '再度ログインしてください。';
        actionButton = (
            <button 
              onClick={() => router.push(`/login?redirectTo=/children/${childId}`)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              ログインページへ
            </button>
        );
    } else if (error === 'NOT_FOUND') {
        errorMessage = 'この子どもの情報を閲覧する権限がありません、または存在しません。';
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg border border-red-200 mb-6 shadow-sm max-w-md w-full text-center">
          <p className="font-bold text-lg mb-2">{errorTitle}</p>
          <p>{errorMessage}</p>
        </div>
        {actionButton}
      </div>
    );
  }

  if (!child) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダー部分 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-4xl bg-gray-100 p-2 rounded-full">{child.gender === '男の子' ? '👦' : '👧'}</span>
              <span>{child.displayName}</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500 ml-1">
              誕生日: {new Date(child.birthday).toLocaleDateString()} 
              <span className="ml-2 font-medium text-indigo-600">({getAge(child.birthday)})</span>
            </p>
          </div>
          <button
            onClick={() => router.push('/children')}
            className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← 一覧に戻る
          </button>
        </div>

        {/* スキル登録フォーム */}
        <SkillLogForm childId={child.id} onSuccess={() => {
            console.log('Log added!');
            // ここでデータの再取得などを行うことができます
        }} />

        {/* ここにグラフや履歴などのコンポーネントを追加可能 */}
        <div className="bg-white shadow rounded-lg p-6 mt-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📊</span> 学習履歴・分析
          </h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center border border-dashed border-gray-300">
            <p className="text-gray-500">
              まだ記録がありません。上のフォームから日々の成長を記録してみましょう！
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// 年齢計算ヘルパー
function getAge(birthdayStr) {
  const birthDate = new Date(birthdayStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age}歳`;
}