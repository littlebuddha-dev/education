// /src/components/ChatUI.js
// 役割: チャットUIコンポーネント。認証方式をapiClientに統一。
// 🔧 修正: エラーハンドリングと認証処理を改善

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // ✅ AuthContextを使用
import { apiClient } from '@/utils/apiClient'; // ✅ apiClientを使用

export default function ChatUI({ childId }) {
  const { user } = useAuth(); // ✅ AuthContextからユーザー情報を取得
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [systemPrompt] = useState('あなたは子どもに優しく丁寧に教える先生です。');
  const [provider] = useState('ollama');
  const [userName, setUserName] = useState('子ども');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const name = `${user.lastName || ''}${user.firstName || ''}`.trim();
      setUserName(name || '子ども');
    }
  }, [user]);

  const sendMessage = async () => {
    if (!input.trim()) {
      alert('メッセージを入力してください。');
      return;
    }

    if (!childId) {
      alert('チャットする子どもを選択してください。');
      return;
    }

    if (!user) {
      alert('ログイン情報が見つかりません。ページを再読み込みしてください。');
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      console.log('[ChatUI] Sending message:', { childId, message: input, provider });
      
      // ✅ apiClientを使用して自動的に認証ヘッダーを付与
      const response = await apiClient('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          systemPrompt, 
          provider, 
          childId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'チャット処理に失敗しました');
      }

      const data = await response.json();
      console.log('[ChatUI] Chat response:', data);

      const aiMessage = {
        role: 'assistant',
        content: data.response || '(先生がうまく応答できませんでした)'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('[ChatUI] Chat error:', err);
      const errorMessage = `通信エラー: ${err.message}`;
      setError(errorMessage);
      
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `(${errorMessage})` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div>
      {error && (
        <div style={{ 
          color: 'red', 
          padding: '0.5rem', 
          marginBottom: '1rem',
          border: '1px solid red',
          borderRadius: '4px',
          backgroundColor: '#ffebee'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ 
        padding: '1rem', 
        border: '1px solid #ccc', 
        height: '400px', 
        overflowY: 'auto',
        backgroundColor: '#fafafa',
        borderRadius: '8px'
      }}>
        {messages.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            marginTop: '150px',
            fontSize: '0.9em'
          }}>
            先生に質問してみましょう！
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            marginBottom: '1rem',
            padding: '0.5rem',
            borderRadius: '8px',
            backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f1f8e9'
          }}>
            <strong style={{
              color: msg.role === 'user' ? '#1976d2' : '#388e3c'
            }}>
              {msg.role === 'user' ? `${userName}：` : '先生：'}
            </strong>
            <div style={{ 
              marginTop: '0.25rem',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ 
            textAlign: 'center', 
            color: '#666',
            fontStyle: 'italic',
            padding: '1rem'
          }}>
            先生が考えています...
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="質問を入力してください（Enterで送信）"
          disabled={isLoading}
          style={{ 
            flex: 1, 
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'vertical',
            minHeight: '60px',
            fontSize: '14px'
          }}
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading || !input.trim()}
          style={{ 
            padding: '0.75rem 1.5rem',
            backgroundColor: (isLoading || !input.trim()) ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? '送信中...' : '送信'}
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '0.8em'
        }}>
          <strong>デバッグ:</strong> childId={childId}, user={user?.email}, messages={messages.length}
        </div>
      )}
    </div>
  );
}