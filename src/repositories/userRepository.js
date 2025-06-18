// src/repositories/userRepository.js
// タイトル: ユーザーリポジトリ
// 役割: usersテーブルに関連するすべてのデータベース操作をカプセル化します。

import { query } from '@/lib/db';

/**
 * メールアドレスでユーザーを検索します。
 * @param {import('pg').Client} client - データベースクライアント
 * @param {string} email - 検索するメールアドレス
 * @returns {Promise<object|null>} ユーザーオブジェクト。見つからない場合はnull。
 */
export async function findUserByEmail(client, email) {
  const result = await client.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

/**
 * 新しいユーザーを作成します。
 * @param {import('pg').Client} client - データベースクライアント
 * @param {object} userData - ユーザーデータ { email, password_hash, first_name, last_name, role, birthday }
 * @returns {Promise<object>} 作成されたユーザーオブジェクト
 */
export async function createUser(client, { email, password_hash, first_name, last_name, role, birthday }) {
  const result = await client.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, birthday)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, role`,
    [email, password_hash, first_name, last_name, role, birthday]
  );
  return result.rows[0];
}
