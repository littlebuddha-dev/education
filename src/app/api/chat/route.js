// /src/app/api/chat/route.js
// 役割: チャット処理API。認証方式を刷新。

import { query } from '@/lib/db';
import { verifyAccessTokenFromHeader } from '@/lib/auth'; // ✅ 修正
import { fetchLLM } from '@/lib/llmRouter';

export async function POST(req) {
  try {
    const user = verifyAccessTokenFromHeader(req); // ✅ 修正
    const { provider, message, systemPrompt, childId } = await req.json();

    let actualChildId = childId;

    if (user.role === 'child') {
      const childProfileResult = await query(
        `SELECT id FROM children WHERE child_user_id = $1`,
        [user.id]
      );
      if (childProfileResult.rows.length === 0) {
        return Response.json({ error: 'この子どもアカウントに対応するプロフィールが見つかりません。' }, { status: 400 });
      }
      actualChildId = childProfileResult.rows[0].id;
    } else if (user.role === 'parent') {
      if (!childId) {
        return Response.json({ error: 'チャット対象の子どもが指定されていません。' }, { status: 400 });
      }
      const childCheck = await query(
        `SELECT id FROM children WHERE id = $1 AND user_id = $2`,
        [childId, user.id]
      );
      if (childCheck.rows.length === 0) {
        return Response.json({ error: '指定された子どもは、この保護者の子どもではありません。' }, { status: 403 });
      }
    } else if (user.role !== 'admin') { // 管理者はチャット可能と仮定
      return Response.json({ error: 'このロールではチャットを利用できません。' }, { status: 403 });
    }
    
    const aiResponse = await fetchLLM(provider, message, systemPrompt || 'あなたは子どもに優しく丁寧に教える先生です。');

    const result = await query(`
      INSERT INTO conversation_logs (user_id, role, message)
      VALUES ($1, 'user', $2), ($1, 'assistant', $3)
      RETURNING id
    `, [user.id, message, aiResponse]);

    const conversationId = result.rows[0].id;

    const evalPrompt = `
あなたは教育評価AIです。以下のチャットの質問内容と回答を評価し、必ず次の形式の JSON オブジェクトのみを返してください：
評価には、学習項目（subject）、具体的な分野（domain）、難易度（level）、その評価に至った理由（reason）、そして今後の学習方針（recommendation）を含めてください。
例: {"subject": "国語", "domain": "語彙力", "level": "初級", "reason": "簡単な単語でも言い換えができなかったため。", "recommendation": "類義語や対義語を使ったクイズを毎日5問出題し、語彙の定着を図る。"}
質問: ${message}
回答: ${aiResponse}
JSON形式のみ出力してください。説明文は不要です。
`;

    const evalResponse = await fetchLLM(provider, message, evalPrompt);

    try {
      const parsed = JSON.parse(evalResponse);
      await query(`
        INSERT INTO evaluation_logs
        (user_id, child_id, conversation_id, subject, domain, level, reason, recommendation)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [user.id, actualChildId, conversationId, parsed.subject, parsed.domain, parsed.level, parsed.reason, parsed.recommendation]);

      await query(`
        INSERT INTO skill_scores (user_id, subject, domain, level, score)
        VALUES ($1, $2, $3, $4, 1)
        ON CONFLICT (user_id, subject, domain)
        DO UPDATE SET score = skill_scores.score + 1, level = EXCLUDED.level, updated_at = CURRENT_TIMESTAMP
      `, [user.id, parsed.subject, parsed.domain, parsed.level]);

      await query(`
        UPDATE child_learning_progress SET status = '達成済み', achieved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE child_id = $1 AND goal_id IN (SELECT id FROM learning_goals WHERE subject = $2 AND domain = $3) AND status != '達成済み'
        RETURNING *;
      `, [actualChildId, parsed.subject, parsed.domain]);
    } catch (err) {
      console.error('スキル評価パースまたは保存エラー:', err.message, 'LLM生応答:', evalResponse);
    }

    return Response.json({ response: aiResponse });
  } catch (err) {
    if (err.message.includes('token') || err.message.includes('Authorization')) {
      return Response.json({ error: `認証エラー: ${err.message}` }, { status: 401 });
    }
    console.error('[chat API エラー]:', err);
    return Response.json({ error: '会話処理に失敗しました' }, { status: 500 });
  }
}