// littlebuddha-dev/education/education-main/src/app/api/chat/route.js
import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth';
import { fetchLLM } from '@/lib/llmRouter';

export async function POST(req) {
  try {
    const user = verifyTokenFromCookie(req); // ✅ Cookieからの検証に変更
    // ✅ childId を受け取る
    const { provider, message, systemPrompt, childId } = await req.json();

    // ✅ childId が提供されていない場合はエラーを返す
    if (!childId) {
      return Response.json({ error: 'チャット対象の子どもが指定されていません。' }, { status: 400 });
    }

    // ✅ childId が認証済みユーザーに紐づくか確認（セキュリティ強化）
    // 保護者ロールであれば、childrenテーブルでuser_idとchildIdが一致するか確認
    if (user.role === 'parent') {
      const childCheck = await query(
        `SELECT id FROM children WHERE id = $1 AND user_id = $2`,
        [childId, user.id]
      );
      if (childCheck.rows.length === 0) {
        return Response.json({ error: '指定された子どもは、この保護者の子どもではありません。' }, { status: 403 });
      }
    }
    // 管理者ロールの場合は、任意のchildIdを許可するが、今回は保護者限定とするため上記チェックで十分。

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
    // ここでLLMへのプロンプトを「接続詞の使い方が弱い」「語彙力が少ない」などの詳細な分析を促すように変更可能
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
        (user_id, child_id, conversation_id, subject, domain, level, reason, recommendation) -- ✅ child_id を追加
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        user.id,
        childId, // ✅ childId を渡す
        conversationId,
        parsed.subject,
        parsed.domain,
        parsed.level,
        parsed.reason,
        parsed.recommendation
      ]);

      // ⑤ スキルスコア更新
      // ここはAIによる評価に応じてスコアを変動させるロジックに拡張可能
      // 例: levelが"初級"なら+1、"中級"なら+2、"上級"なら+3など
      await query(`
        INSERT INTO skill_scores (user_id, subject, domain, level, score)
        VALUES ($1, $2, $3, $4, 1) -- 現状は常に1を足すが、AI評価のlevelに応じて変更する
        ON CONFLICT (user_id, subject, domain)
        DO UPDATE SET
          score = skill_scores.score + 1, -- ここをAI評価のlevelに応じた加算値に変更する
          level = EXCLUDED.level,
          updated_at = CURRENT_TIMESTAMP
      `, [
        user.id,
        parsed.subject,
        parsed.domain,
        parsed.level
      ]);

    } catch (err) {
      console.error('スキル評価パースエラーまたは保存エラー:', err.message);
      console.error('LLM生応答:', evalResponse); // ✅ エラー時に生のLLM応答をログ出力
      // エラーが発生しても、メインのチャット応答は返す
    }

    return Response.json({ response: aiResponse });

  } catch (err) {
    console.error('[chat API エラー]:', err);
    return Response.json({ error: err.message || '会話処理に失敗しました' }, { status: 500 });
  }
}
