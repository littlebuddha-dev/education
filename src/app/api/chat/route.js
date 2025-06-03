// littlebuddha-dev/education/education-main/src/app/api/chat/route.js
import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth';
import { fetchLLM } from '@/lib/llmRouter';

export async function POST(req) {
  try {
    const user = verifyTokenFromCookie(req);
    const { provider, message, systemPrompt, childId } = await req.json();

    if (!childId) {
      return Response.json({ error: 'チャット対象の子どもが指定されていません。' }, { status: 400 });
    }

    if (user.role === 'parent') {
      const childCheck = await query(
        `SELECT id FROM children WHERE id = $1 AND user_id = $2`,
        [childId, user.id]
      );
      if (childCheck.rows.length === 0) {
        return Response.json({ error: '指定された子どもは、この保護者の子どもではありません。' }, { status: 403 });
      }
    }

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
あなたは教育評価AIです。以下のチャットの質問内容と回答を評価し、必ず次の形式の JSON オブジェクトのみを返してください。
評価には、学習項目（subject）、具体的な分野（domain）、難易度（level）、その評価に至った理由（reason）、そして今後の学習方針（recommendation）を含めてください。
特に、子どもの弱点や改善点を具体的に記述し、それに合わせた学習方針を提案してください。
例: {"subject": "国語", "domain": "語彙力", "level": "初級", "reason": "簡単な単語でも言い換えができなかったため。", "recommendation": "類義語や対義語を使ったクイズを毎日5問出題し、語彙の定着を図る。"}
質問: ${message}
回答: ${aiResponse}
JSON形式のみ出力してください。説明文は不要です。
`;

    const evalResponse = await fetchLLM(provider, message, evalPrompt);

    try {
      const parsed = JSON.parse(evalResponse);

      // ④ 評価ログ保存
      await query(`
        INSERT INTO evaluation_logs
        (user_id, child_id, conversation_id, subject, domain, level, reason, recommendation)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        user.id,
        childId,
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

      // ✅ 追加: 学習進捗の更新ロジック
      // 評価結果に基づいて、子どもの学習目標の進捗を更新
      // ここでは簡易的に、評価された subject と domain に合致する学習目標を「達成済み」にするロジックを例示します
      // より複雑な達成条件（例: スコアが一定値以上、特定の問題をクリアなど）は別途実装が必要です
      const updatedGoals = await query(`
        UPDATE child_learning_progress
        SET status = '達成済み', achieved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE child_id = $1
          AND goal_id IN (
            SELECT id FROM learning_goals
            WHERE subject = $2 AND domain = $3
          )
        AND status != '達成済み' -- すでに達成済みのものは更新しない
        RETURNING *;
      `, [childId, parsed.subject, parsed.domain]);

      if (updatedGoals.rows.length > 0) {
        console.log(`Child ${childId} achieved learning goals:`, updatedGoals.rows.map(g => g.goal_id));
        // ここで、達成した目標を子どもに通知するAI応答を生成するロジックを追加することも可能
        // 例: `aiResponse += "\nおめでとう！「" + parsed.subject + "の" + parsed.domain + "」の学習目標を達成しました！";`
      }

    } catch (err) {
      console.error('スキル評価パースエラーまたは保存エラー:', err.message);
      console.error('LLM生応答:', evalResponse);
      // エラーが発生しても、メインのチャット応答は返す
    }

    return Response.json({ response: aiResponse });

  } catch (err) {
    console.error('[chat API エラー]:', err);
    return Response.json({ error: err.message || '会話処理に失敗しました' }, { status: 500 });
  }
}
