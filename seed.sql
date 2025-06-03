-- seed.sql

-- 管理者ユーザー (パスワードは 'adminpassword' のハッシュ)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@example.com', '$2b$10$YOUR_GENERATED_ADMIN_HASH', '管理者', 'テスト', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 保護者ユーザー (パスワードは 'parentpassword' のハッシュ)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('parent@example.com', '$2b$10$YOUR_GENERATED_PARENT_HASH', '保護者', '山田', 'parent')
ON CONFLICT (email) DO NOTHING;

-- 後で保護者ユーザーの子どもを追加する場合
-- (parent@example.com の user_id を確認して置き換える)
-- INSERT INTO children (user_id, name, birthday, gender) VALUES
-- ((SELECT id FROM users WHERE email = 'parent@example.com'), '太郎', '2018-04-01', '男の子')
-- ON CONFLICT DO NOTHING;