// /src/app/api/users/register/route.js
// 役割: ユーザー登録API（子どもプロフィール作成対応・新スキーマ版）

import { getClient, beginTransaction, commitTransaction, rollbackTransaction, releaseClient } from '@/lib/db';
import { findUserByEmail, createUser } from '@/repositories/userRepository';
// createChildProfile をインポート
import { createChildProfile } from '@/repositories/childRepository';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// ✅ Zodスキーマの定義
const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  first_name: z.string().min(1, '名前を入力してください'),
  last_name: z.string().min(1, '名字を入力してください'),
  role: z.enum(['parent', 'child', 'admin']).optional(),
  birthday: z.string().optional().nullable(),
});

export async function POST(req) {
  const client = await getClient();
  try {
    await beginTransaction(client);
    const body = await req.json();

    // ✅ Zodによるバリデーション
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      await rollbackTransaction(client);
      const errorMessages = validation.error.issues.map(issue => issue.message).join(', ');
      return Response.json({ error: errorMessages }, { status: 400 });
    }

    const { email, password, first_name, last_name, role, birthday } = validation.data;

    console.log('[Register API] Registration request:', { email, role, first_name, last_name, birthday });

    const existingUser = await findUserByEmail(client, email);
    if (existingUser) {
      await rollbackTransaction(client);
      return Response.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await createUser(client, {
      email,
      password_hash,
      first_name,
      last_name,
      role: role || 'parent',
      birthday
    });

    console.log('[Register API] User created:', { id: newUser.id, role: newUser.role });

    // 子どもロールの場合、childrenテーブルにも自身のプロフィールを作成
    if (newUser.role === 'child') {
      const displayName = `${last_name || ''} ${first_name || ''}`.trim();
      if (!displayName) {
        throw new Error('子どもの名前が設定されていません。');
      }

      console.log('[Register API] Creating child profile for self:', { displayName, birthday, user_id: newUser.id });

      const childProfile = await createChildProfile(client, {
        user_id: newUser.id,
        display_name: displayName,
        birthday
      });

      console.log('[Register API] Child profile created:', { profileId: childProfile.id });
    }

    await commitTransaction(client);
    console.log('[Register API] Registration completed successfully');

    return Response.json({
      message: '登録が完了しました。',
      user: {
        id: newUser.id,
        role: newUser.role
      }
    });

  } catch (err) {
    if (client) await rollbackTransaction(client);
    console.error('[Register API] Registration error:', err);
    return Response.json({ error: err.message || '登録処理に失敗しました。' }, { status: 500 });
  } finally {
    if (client) releaseClient(client);
  }
}