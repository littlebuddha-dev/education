'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export default function ChatUI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [systemPrompt] = useState('あなたは子どもに優しく丁寧に教える先生です。');
  const [provider] = useState('ollama');
  const [userName, setUserName] = useState('子ども');

  useEffect(() => {
    const token = getCookie('token');
    if (token) {
      const decoded = jwtDecode(token);
      const name = `${decoded.last_name || ''}${decoded.first_name || ''}`;
      setUserName(name || '子ども');
    }
  }, []);

  const sendMessage = async () => {
    const token = getCookie('token');
    if (!token) {
      alert('ログイン情報がありません。ログインしてください。');
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ Cookie を送信
        body: JSON.stringify({ message: input, systemPrompt, provider })
      });

      const data = await res.json();

      const aiMessage = {
        role: 'assistant',
        content: data.response || '(先生がうまく応答できませんでした)'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('チャット送信エラー:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '(通信エラーが発生しました)' }
      ]);
    }
  };

  return (
    <div>
      <div style={{ padding: '1rem', border: '1px solid #ccc', height: '400px', overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{msg.role === 'user' ? `${userName}：` : '先生：'}</strong>
            <span style={{ marginLeft: '0.5rem' }}>{msg.content}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="質問を入力してください"
          style={{ width: '80%', padding: '0.5rem' }}
        />
        <button onClick={sendMessage} style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
          送信
        </button>
      </div>
    </div>
  );
}

// ✅ Cookie から値を取り出す関数
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}
