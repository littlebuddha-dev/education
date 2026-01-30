// src/app/chat/page.js
// 役割: チャットページ。子供を選択し、ChatUIにIDを渡すコンテナとしての役割を持つ。

'use client';

import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/lib/useAuthGuard';
import ChatUI from '@/components/ChatUI';
import { useEffect, useState } from 'react';
import { apiClient } from '@/utils/apiClient';

export default function ChatPage() {
  // 認証ガード
  useAuthGuard();

  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [loading, setLoading] = useState(true);

  // ユーザーに紐づく子供一覧を取得
  useEffect(() => {
    if (!user) return;

    const fetchChildren = async () => {
      try {
        setLoading(true);
        // GETリクエストで子供一覧を取得
        const response = await apiClient('/api/children');
        
        let data = [];
        // apiClientのレスポンス形式に合わせてデータを取得
        if (response.ok === false) {
           console.error("Error fetching children");
        } else {
           // apiClientがResponseオブジェクトを返す場合はjson()を呼ぶ
           // (apiClientの実装によっては直接JSONを返す場合もあるので注意が必要ですが、
           //  直近の修正でResponseを返す仕様になっています)
           data = await response.json();
        }

        if (Array.isArray(data)) {
          setChildren(data);
          // 子供が一人でもいれば、最初の一人をデフォルト選択
          if (data.length > 0) {
            setSelectedChildId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch children:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  // ローディング中
  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // 子供が登録されていない場合
  if (children.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">チャット機能を利用するには、まず子供の情報を登録してください。</p>
        {user.role === 'parent' && (
          <a href="/children" className="text-blue-600 underline">子供一覧ページへ</a>
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 flex flex-col">
      {/* 親アカウントで、かつ子供が複数人いる場合のみ選択バーを表示 
        (子供アカウントの場合は自分自身しか返ってこないので表示不要)
      */}
      {user.role === 'parent' && children.length > 1 && (
        <div className="bg-white p-3 border-b shadow-sm flex items-center justify-center gap-3 z-10">
          <label htmlFor="child-select" className="text-sm font-bold text-gray-700">
            チャットする相手:
          </label>
          <select
            id="child-select"
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="p-2 border rounded-md text-sm min-w-[200px]"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 選択されたIDをChatUIに渡す */}
      {selectedChildId ? (
        // key属性にIDを指定することで、子供を切り替えた時にコンポーネントをリセット(履歴クリア)する
        <ChatUI key={selectedChildId} childId={selectedChildId} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          子供を選択してください
        </div>
      )}
    </div>
  );
}