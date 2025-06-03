// littlebuddha-dev/education/education-main/src/app/api/children/link/route.js
import { query } from '@/lib/db';
import { verifyTokenFromHeader } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = verifyTokenFromHeader(req);
    // 保護者ロールのみ許可
    if (user.role !== 'parent') {
      return Response.json({ error: '保護者のみがこの操作を行えます' }, { status: 403 });
    }

    const { childEmail } = await req.json(); // 紐付けたい子どものメールアドレス

    // 1. childEmail に対応する 'child' ロールのユーザーを探す
    const childUserResult = await query(
      `SELECT id FROM users WHERE email = $1 AND role = 'child'`,
      [childEmail]
    );

    if (childUserResult.rows.length === 0) {
      return Response.json({ error: '指定されたメールアドレスの子どもアカウントが見つかりません' }, { status: 404 });
    }
    const childUserId = childUserResult.rows[0].id;

    // 2. その子どもユーザーIDに紐付く children テーブルのレコードを探す
    // (child_user_id はあるが user_id が NULL のレコード)
    const childrenResult = await query(
      `SELECT id FROM children WHERE child_user_id = $1 AND user_id IS NULL`,
      [childUserId]
    );

    if (childrenResult.rows.length === 0) {
      return Response.json({ error: 'この子どもアカウントは既に別の保護者に紐付けられているか、存在しません' }, { status: 400 });
    }
    const childProfileId = childrenResult.rows[0].id;

    // 3. children テーブルのレコードの user_id を更新して紐付け
    await query(
      `UPDATE children SET user_id = $1 WHERE id = $2`,
      [user.id, childProfileId]
    );

    return Response.json({ message: '子どもアカウントが紐付けられました', childProfileId });
  } catch (err) {
    console.error('子どもアカウント紐付けエラー:', err);
    return Response.json({ error: err.message || '子どもアカウントの紐付けに失敗しました' }, { status: 500 });
  }
}