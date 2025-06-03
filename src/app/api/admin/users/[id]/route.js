import { query } from '@/lib/db';
import { verifyTokenFromHeader } from '@/lib/auth';

export async function DELETE(req, { params }) {
  try {
    const user = verifyTokenFromHeader(req);
    if (user.role !== 'admin') {
      return Response.json({ error: '管理者専用操作です' }, { status: 403 });
    }

    const userIdToDelete = params.id;

    // 自分自身は削除不可にしておく（任意）
    if (user.id === userIdToDelete) {
      return Response.json({ error: '自分自身は削除できません' }, { status: 400 });
    }

    await query(`DELETE FROM users WHERE id = $1`, [userIdToDelete]);

    return Response.json({ success: true });
  } catch (err) {
    console.error('ユーザー削除エラー:', err);
    return Response.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
