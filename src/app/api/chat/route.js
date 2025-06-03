// littlebuddha-dev/education/education-main/src/app/api/chat/route.js
import { query } from '@/lib/db';
import { verifyTokenFromCookie } from '@/lib/auth';
import { fetchLLM } from '@/lib/llmRouter';

export async function POST(req) {
  try {
    const user = verifyTokenFromCookie(req);
    const { provider, message, systemPrompt, childId } = await req.json(); // chat.page.jsから渡されるchildId

    let actualChildId = childId; // APIに渡されたchildIdを初期値とする

    // ユーザーが 'child' ロールの場合、自身の child_user_id を使用
    if (user.role === 'child') {
      const childProfileResult = await query(
        `SELECT id FROM children WHERE child_user_id = $1`,
        [user.id]
      );
      if (childProfileResult.rows.length === 0) {
        return Response.json({ error: 'この子どもアカウントに対応するプロフィールが見つかりません。' }, { status: 400 });
      }
      actualChildId = childProfileResult.rows[0].id; // 自身の children.id を実際の childId とする
    } else if (user.role === 'parent') {
      // 保護者の場合、APIに渡されたchildIdの妥当性を確認
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
    } else {
      // 'admin' など、想定外のロールはチャットを許可しない
      return Response.json({ error: 'このロールではチャットを利用できません。' }, { status: 403 });
    }

    // ① AI応答
    const aiResponse = await fetchLLM(provider, message, systemPrompt || 'あなたは子どもに優しく丁寧に教える先生です。');

    // ② 会話ログ保存 - user_id は会話を始めたユーザー（親または子）
    const result = await query(`
      INSERT INTO conversation_logs (user_id, role, message)
      VALUES ($1, 'user', $2), ($1, 'assistant', $3)
      RETURNING id
    `, [user.id, message, aiResponse]); // user.id はログインしているユーザーのID

    const conversationId = result.rows[0].id;

    // ③ スキル評価プロンプトで fetchLLM
    const evalPrompt = `
あなたは教育評価AIです。以下のチャットの質問内容と回答を評価し、必ず次の形式の JSON オブジェクトのみを返してください：
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

      // ④ 評価ログ保存 - user_id は会話したユーザー、child_id は実際に学習している子ども
      await query(`
        INSERT INTO evaluation_logs
        (user_id, child_id, conversation_id, subject, domain, level, reason, recommendation)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        user.id, // 会話したユーザーのID (保護者または子ども自身)
        actualChildId, // 実際に学習している子どもの children.id
        conversationId,
        parsed.subject,
        parsed.domain,
        parsed.level,
        parsed.reason,
        parsed.recommendation
      ]);

      // ⑤ スキルスコア更新 - user_id は会話したユーザーのID
      await query(`
        INSERT INTO skill_scores (user_id, subject, domain, level, score)
        VALUES ($1, $2, $3, $4, 1)
        ON CONFLICT (user_id, subject, domain)
        DO UPDATE SET
          score = skill_scores.score + 1,
          level = EXCLUDED.level,
          updated_at = CURRENT_TIMESTAMP
      `, [
        user.id, // スキルスコアは会話したユーザーに紐付ける (ここでは学習者自身)
        parsed.subject,
        parsed.domain,
        parsed.level
      ]);

      // 学習進捗の更新ロジック (actualChildId を使用)
      const updatedGoals = await query(`
        UPDATE child_learning_progress
        SET status = '達成済み', achieved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE child_id = $1
          AND goal_id IN (
            SELECT id FROM learning_goals
            WHERE subject = $2 AND domain = $3
          )
        AND status != '達成済み'
        RETURNING *;
      `, [actualChildId, parsed.subject, parsed.domain]);

      if (updatedGoals.rows.length > 0) {
        console.log(`Child ${actualChildId} achieved learning goals:`, updatedGoals.rows.map(g => g.goal_id));
      }

    } catch (err) {
      console.error('スキル評価パースエラーまたは保存エラー:', err.message);
      console.error('LLM生応答:', evalResponse);
    }

    return Response.json({ response: aiResponse });

  } catch (err) {
    console.error('[chat API エラー]:', err);
    return Response.json({ error: err.message || '会話処理に失敗しました' }, { status: 500 });
  }
}
