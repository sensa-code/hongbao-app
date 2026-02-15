-- ============================================
-- 紅包抽獎系統 - Supabase Schema Migration
-- Schema: hongbao (完全隔離)
-- ============================================

-- 1. 建立獨立 schema
CREATE SCHEMA IF NOT EXISTS hongbao;

-- 2. 專案表
CREATE TABLE hongbao.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '紅包抽獎',
  total_people INTEGER NOT NULL CHECK (total_people > 0),
  daily_budget INTEGER NOT NULL CHECK (daily_budget > 0),
  min_amount INTEGER NOT NULL CHECK (min_amount > 0),
  max_amount INTEGER NOT NULL CHECK (max_amount > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_amount_range CHECK (min_amount <= max_amount),
  CONSTRAINT valid_date_range CHECK (start_date <= end_date),
  CONSTRAINT valid_budget CHECK (
    min_amount * total_people <= daily_budget
    AND max_amount * total_people >= daily_budget
  )
);

-- 3. 抽獎紀錄表
CREATE TABLE hongbao.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES hongbao.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  amount INTEGER NOT NULL CHECK (amount > 0),
  draw_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 索引
CREATE INDEX idx_draws_project_date ON hongbao.draws(project_id, draw_date);
CREATE INDEX idx_draws_project_name_date ON hongbao.draws(project_id, name, draw_date);
CREATE UNIQUE INDEX idx_draws_unique_per_day ON hongbao.draws(project_id, name, draw_date);

-- 5. RLS (Row Level Security)
ALTER TABLE hongbao.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hongbao.draws ENABLE ROW LEVEL SECURITY;

-- 允許匿名讀寫（公開紅包活動，無需登入）
CREATE POLICY "projects_public_read" ON hongbao.projects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "projects_public_insert" ON hongbao.projects
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "draws_public_read" ON hongbao.draws
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "draws_public_insert" ON hongbao.draws
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 6. 將 hongbao schema 加入 API exposed schemas
-- 需要在 Supabase Dashboard > Settings > API > Exposed schemas 中加入 hongbao
-- 或者執行以下指令（需要 superuser 權限）：
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, hongbao';
NOTIFY pgrst, 'reload config';

-- 7. 授權
GRANT USAGE ON SCHEMA hongbao TO anon, authenticated;
GRANT SELECT, INSERT ON hongbao.projects TO anon, authenticated;
GRANT SELECT, INSERT ON hongbao.draws TO anon, authenticated;

-- ============================================
-- 驗證
-- ============================================
-- SELECT * FROM hongbao.projects;
-- SELECT * FROM hongbao.draws;
