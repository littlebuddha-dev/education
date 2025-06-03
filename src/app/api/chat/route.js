import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth';
import { fetchLLM } from '@/lib/llmRouter';

export async function POST(req) {
  try {
    const user = verifyTokenFromCookie(req); // ✅ Cookieからの検証に変更
    const { provider, message, systemPrompt } = await req.json();

    // ① AI応答
    const aiResponse = await fetchLLM(provider, message, systemPrompt || 'あなたは子どもに優しく丁寧に教える先生です。');

    // ② 会話ログ保存
    const result = await query(`
      INSERT INTO conversation_logs (user_id, role, message)
      VALUES ($1, 'user', $2), ($1, 'assistant', $3)
      RETURNING id
    `, [user.id, message, aiResponse]);

    const conversationId = result.rows[0].id;

    // ③ スキル評価プロンプトで fetchLLM
const evalPrompt = `
あなたは教育評価AIです。以下の発話を評価し、必ず次の形式の JSON オブジェクトのみを返してください：

{
  "subject": "国語",
  "domain": "語彙",
  "level": "初級",
  "reason": "〜",
  "recommendation": "〜"
}

質問: ${message}
JSON形式のみ出力してください。説明文は不要です。
`;


    const evalResponse = await fetchLLM(provider, message, evalPrompt);

    try {
      const parsed = JSON.parse(evalResponse);

      // ④ 評価ログ保存
      await query(`
        INSERT INTO evaluation_logs
        (user_id, conversation_id, subject, domain, level, reason, recommendation)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        user.id,
        conversationId,
        parsed.subject,
        parsed.domain,
        parsed.level,
        parsed.reason,
        parsed.recommendation
      ]);

      // ⑤ スキルスコア更新
      await query(`
        INSERT INTO skill_scores (user_id, subject, domain, level, score)
        VALUES ($1, $2, $3, $4, 1)
        ON CONFLICT (user_id, subject, domain)
        DO UPDATE SET
          score = skill_scores.score + 1,
          level = EXCLUDED.level,
          updated_at = CURRENT_TIMESTAMP
      `, [
        user.id,
        parsed.subject,
        parsed.domain,
        parsed.level
      ]);

    } catch (err) {
      console.error('スキル評価パースエラー:', err.message);
    }

    return Response.json({ response: aiResponse });

  } catch (err) {
    console.error('[chat API エラー]:', err);
    return Response.json({ error: err.message || '会話処理に失敗しました' }, { status: 500 });
  }
}
