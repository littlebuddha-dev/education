// src/app/chat/page.js
// 役割: AIチャット画面。認証ガードを使用し、APIと連携する。

'use client';

import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/lib/useAuthGuard'; // ✅ 作成したファイルをインポート
import ChatUI from '@/components/ChatUI';
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';

export default function ChatPage() {
  // 認証ガード: 未ログインならリダイレクト
  useAuthGuard();

  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 初回ロード時に履歴を取得する場合（API実装があれば）
  // useEffect(() => { ... }, []);

  const handleSendMessage = useCallback(async (text) => {
    setIsLoading(true);
    setError(null);

    // ユーザーのメッセージを即座に表示
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);

    try {
      // APIに送信
      const response = await apiClient.post('/api/chat', { message: text });
      
      // AIの応答を表示
      const aiMessage = { role: 'assistant', content: response.reply };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      setError('メッセージの送信に失敗しました。時間をおいて再試行してください。');
      // エラーメッセージを表示
      setMessages(prev => [...prev, { role: 'system', content: 'エラーが発生しました。' }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // まだユーザー情報がロードされていない間はローディング表示
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50"> {/* Navbarの高さを引く */}
      <ChatUI 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading}
      />
      {error && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}