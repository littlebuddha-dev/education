// src/components/SkillLogForm.js
// 役割: 子どものスキルログ（学習記録）を登録するフォームコンポーネント
// 修正: authUtils.js から削除された getCookie への依存を排除し、AuthContextを利用するように変更。

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // ✅ AuthContextからトークンを取得する

export default function SkillLogForm({ childId, onSuccess }) {
  const { user, token } = useAuth(); // ✅ Contextからトークンを取得
  const [domain, setDomain] = useState('');
  const [skillName, setSkillName] = useState('');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // 評価分野の選択肢
  const domains = [
    'Cognitive', 'Language', 'Motor', 'Social-Emotional', 'Adaptive'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // バリデーション
    if (!domain || !skillName || !score) {
        setMessage({ type: 'error', text: '必須項目を入力してください' });
        setIsSubmitting(false);
        return;
    }

    try {
      // ✅ Contextから取得したトークンを使用 (getCookieは不要)
      const accessToken = token; 

      if (!accessToken) {
        throw new Error('認証トークンが見つかりません。再ログインしてください。');
      }

      const res = await fetch(`/api/children/${childId}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // ✅ ヘッダーにトークンを付与
        },
        body: JSON.stringify({
          domain,
          skill_name: skillName,
          score: parseInt(score, 10),
          notes
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '登録に失敗しました');
      }

      setMessage({ type: 'success', text: 'スキルログを登録しました！' });
      
      // フォームリセット
      setDomain('');
      setSkillName('');
      setScore('');
      setNotes('');

      // 親コンポーネントに通知（リスト更新など）
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Skill log error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <span className="bg-indigo-100 text-indigo-600 p-2 rounded-full mr-2">✏️</span>
        新しい記録を追加
      </h3>
      
      {message && (
        <div className={`p-4 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 分野選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">評価分野 (Domain) <span className="text-red-500">*</span></label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">選択してください</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* スコア入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">スコア (1-5) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              max="5"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例: 3"
              required
            />
          </div>
        </div>

        {/* スキル名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">スキル・課題名 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="例: 積み木を3つ積む"
            required
          />
        </div>

        {/* メモ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">観察メモ・コメント</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="どのような状況で達成できたか、サポートの有無など..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}
            transition-colors duration-200`}
        >
          {isSubmitting ? '登録中...' : '記録を保存'}
        </button>
      </form>
    </div>
  );
}