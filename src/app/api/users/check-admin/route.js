// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/app/api/users/check-admin/route.js
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`SELECT COUNT(*) FROM users WHERE role = 'admin'`);
    const adminExists = parseInt(result.rows[0].count) > 0;
    return Response.json({ adminExists });
  } catch (err) {
    console.error('Error checking admin user existence:', err);
    // データベース接続エラーやusersテーブルが存在しない場合のハンドリング
    // ここでテーブルが存在しないエラー (42P01) をキャッチし、adminExists: false として返す
    if (err.code === '42P01' || (err.message && err.message.includes('relation "users" does not exist'))) {
      return Response.json({ adminExists: false, error: 'users テーブルが存在しません。' }, { status: 200 });
    }
    // その他のデータベース接続エラーなど
    let errorMessage = '管理者ユーザーの存在確認に失敗しました。';
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      errorMessage = 'データベースホストが見つからないか、接続が拒否されました。';
    } else if (err.code === '28P01') { // PostgreSQL authentication_failed
      errorMessage = 'データベース認証に失敗しました。';
    } else if (err.code === '3D000') { // PostgreSQL invalid_catalog_name
      errorMessage = '指定されたデータベースが存在しません。';
    }

    // 予期せぬエラーは500で返す
    return Response.json({ adminExists: false, error: errorMessage }, { status: 500 });
  }
}