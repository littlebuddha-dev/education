-- schema.sql

-- users テーブル
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'parent' NOT NULL, -- 'parent' or 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- children テーブル
CREATE TABLE IF NOT EXISTS children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    birthday DATE,
    gender VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- conversation_logs テーブル
CREATE TABLE IF NOT EXISTS conversation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- evaluation_logs テーブル
CREATE TABLE IF NOT EXISTS evaluation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE SET NULL, -- ✅ 追加: child_id を追加し、子どもの情報に紐付ける
    conversation_id UUID REFERENCES conversation_logs(id) ON DELETE SET NULL, -- 会話ログが削除されても評価は残る
    subject VARCHAR(255),
    domain VARCHAR(255),
    level VARCHAR(255),
    reason TEXT,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- skill_scores テーブル (ユーザーごとの総合スキルスコア)
CREATE TABLE IF NOT EXISTS skill_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    level VARCHAR(255), -- 最新の評価レベルを保持
    score INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subject, domain) -- ユーザー、教科、分野の組み合わせでユニーク
);

-- skill_logs テーブル (詳細なスキル記録)
CREATE TABLE IF NOT EXISTS skill_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    session_id UUID, -- 会話セッションIDなど、関連付けたいものがあれば
    domain VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL,
    context TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_id ON conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_logs_user_id ON evaluation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_logs_child_id ON evaluation_logs(child_id); -- ✅ 追加: child_id のインデックス
CREATE INDEX IF NOT EXISTS idx_skill_scores_user_subject_domain ON skill_scores(user_id, subject, domain);
CREATE INDEX IF NOT EXISTS idx_skill_logs_child_id ON skill_logs(child_id);
