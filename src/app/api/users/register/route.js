// src/app/api/users/register/route.js
// タイトル: ユーザー登録API（リポジトリパターン適用版）
// 役割: ユーザーからの登録リクエストを受け付け、UserRepositoryとChildRepositoryを呼び出してデータ処理を行います。

import { getClient, beginTransaction, commitTransaction, rollbackTransaction, releaseClient } from '@/lib/db';
import { findUserByEmail, createUser } from '@/repositories/userRepository'; // [修正]
import { createChildProfile } from '@/repositories/childRepository';      // [修正]
import bcrypt from 'bcrypt';

export async function POST(req) {
  const client = await getClient();
  try {
    await beginTransaction(client);
    const { email, password, first_name, last_name, role, birthday } = await req.json();

    // メールアドレスの存在チェック
    const existingUser = await findUserByEmail(client, email);
    if (existingUser) {
      await rollbackTransaction(client);
      return Response.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
    }

    // パスワードのハッシュ化とユーザー作成
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await createUser(client, { email, password_hash, first_name, last_name, role: role || 'parent', birthday });

    // 子どもロールの場合、childrenテーブルにも登録
    if (newUser.role === 'child') {
      const childName = `${last_name || ''} ${first_name || ''}`.trim();
      if (!childName) {
        throw new Error('子どもの名前が設定されていません。');
      }
      await createChildProfile(client, { child_user_id: newUser.id, name: childName, birthday });
    }

    await commitTransaction(client);
    return Response.json({ message: '登録が完了しました。' });

  } catch (err) {
    if (client) await rollbackTransaction(client);
    console.error('登録APIエラー:', err);
    return Response.json({ error: err.message || '登録処理に失敗しました。' }, { status: 500 });
  } finally {
    if (client) releaseClient(client);
  }
}
