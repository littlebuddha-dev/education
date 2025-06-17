// src/repositories/childRepository.js
// タイトル: 子どもリポジトリ
// 役割: childrenテーブルに関連するデータベース操作をカプセル化します。

import { query } from '@/lib/db';

/**
 * 新しい子どものプロフィールを作成します。
 * @param {import('pg').Client} client - データベースクライアント
 * @param {object} childData - 子どもデータ { child_user_id, name, birthday }
 * @returns {Promise<object>} 作成された子どもオブジェクト
 */
export async function createChildProfile(client, { child_user_id, name, birthday }) {
  const result = await client.query(
    `INSERT INTO children (child_user_id, name, birthday)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [child_user_id, name, birthday]
  );
  return result.rows[0];
}
