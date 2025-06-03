// src/app/api/admin/users/route.js
import { query } from '@/lib/db';
import { verifyTokenFromHeader } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = verifyTokenFromHeader(req);
    if (user.role !== 'admin') {
      return Response.json({ error: '管理者専用ページです' }, { status: 403 });
    }

    // ユーザーと子ども数をJOINで取得
    // 保護者に紐付く子ども と、子ども自身のアカウントに紐付くプロフィール を両方取得する
    const result = await query(`
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
        COUNT(c_parent.id) FILTER (WHERE c_parent.id IS NOT NULL) AS children_count_parent, -- 保護者として紐付く子ども数
        COUNT(c_child_self.id) FILTER (WHERE c_child_self.id IS NOT NULL) AS children_count_self, -- 自身が子どもアカウントの場合のプロフィール数
        JSON_AGG(
          CASE
            WHEN c_parent.id IS NOT NULL THEN json_build_object('id', c_parent.id, 'name', c_parent.name)
            WHEN c_child_self.id IS NOT NULL THEN json_build_object('id', c_child_self.id, 'name', c_child_self.name)
          END
        ) FILTER (WHERE c_parent.id IS NOT NULL OR c_child_self.id IS NOT NULL) AS children
      FROM users u
      LEFT JOIN children c_parent ON u.id = c_parent.user_id -- 保護者としての子ども
      LEFT JOIN children c_child_self ON u.id = c_child_self.child_user_id AND u.role = 'child' -- 子ども自身のアカウントのプロフィール
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // 結果を整形して、children_count を合計する
    const formattedUsers = result.rows.map(row => ({
      ...row,
      children_count: row.role === 'child' ? row.children_count_self : row.children_count_parent, // ロールに応じて適切な子ども数を表示
      children: row.children ? row.children.filter((item, index, self) =>
        item && self.findIndex(t => t && t.id === item.id) === index // 重複する子どもを排除
      ) : []
    }));


    return Response.json(formattedUsers);
  } catch (err) {
    console.error('管理者ユーザー一覧取得エラー:', err);
    return Response.json({ error: '一覧取得に失敗しました' }, { status: 500 });
  }
}
