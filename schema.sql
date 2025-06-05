-- schema.sql

-- users テーブル
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'parent' NOT NULL,
    birthday DATE, -- 💡 追加: users テーブルに birthday カラム
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- children テーブル
-- ここでは、子どもの詳細プロフィール情報と、保護者への紐付けを管理します。
-- user_id が NULL の場合、その子どもは親アカウントに紐付いていない独立した学習者アカウントとみなされます。
CREATE TABLE IF NOT EXISTS children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- ✅ 修正: NULL を許容する (保護者に紐付けられていない場合)
    name VARCHAR(255) NOT NULL,
    birthday DATE, -- 💡 追加: children テーブルにも birthday カラムがあることを確認
    gender VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- ✅ 追加: 子どものユーザーIDを直接紐付ける (自身がusersテーブルに登録された子どもの場合)
    -- これにより、childrenテーブルのレコードが独立した子供アカウントと、保護者管理下の子供の双方に対応できるようにする
    child_user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE
);

-- conversation_logs テーブル
CREATE TABLE IF NOT EXISTS conversation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 会話したユーザーID (child_user_id または parent_user_id)
    role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- evaluation_logs テーブル
CREATE TABLE IF NOT EXISTS evaluation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 評価対象のユーザーID（ここでは会話した子ども）
    child_id UUID REFERENCES children(id) ON DELETE CASCADE, -- 修正: CASCADE に変更。childrenテーブルのレコードが削除されたら評価も削除
    conversation_id UUID REFERENCES conversation_logs(id) ON DELETE SET NULL, -- 会話ログが削除されても評価は残る
    subject VARCHAR(255),
    domain VARCHAR(255),
    level VARCHAR(255),
    reason TEXT,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- skill_scores テーブル (ユーザーごとの総合スキルスコア)
-- ここで user_id は学習者（親または子）のusers.id
CREATE TABLE IF NOT EXISTS skill_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    level VARCHAR(255),
    score INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subject, domain)
);

-- skill_logs テーブル (詳細なスキル記録)
-- ここで child_id は childrenテーブルのid
CREATE TABLE IF NOT EXISTS skill_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    session_id UUID,
    domain VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL,
    context TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- learning_goals テーブル
CREATE TABLE IF NOT EXISTS learning_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    recommended_age_min INTEGER,
    recommended_age_max INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- child_learning_progress テーブル
CREATE TABLE IF NOT EXISTS child_learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES learning_goals(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT '未学習' NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    achieved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(child_id, goal_id)
);


-- インデックスの追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_children_child_user_id ON children(child_user_id); -- ✅ 追加
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_id ON conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_logs_user_id ON evaluation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_logs_child_id ON evaluation_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_skill_scores_user_subject_domain ON skill_scores(user_id, subject, domain);
CREATE INDEX IF NOT EXISTS idx_skill_logs_child_id ON skill_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_learning_goals_subject_domain ON learning_goals(subject, domain);
CREATE INDEX IF NOT EXISTS idx_child_learning_progress_child_goal ON child_learning_progress(child_id, goal_id);