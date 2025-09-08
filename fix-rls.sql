-- RLS 정책을 임시로 비활성화하여 저장 문제 해결
-- Supabase SQL Editor에서 실행하세요

-- business_cards 테이블의 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can view public cards" ON business_cards;
DROP POLICY IF EXISTS "Users can create own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can update own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON business_cards;

-- RLS 비활성화 (임시)
ALTER TABLE business_cards DISABLE ROW LEVEL SECURITY;

-- 또는 더 관대한 정책으로 교체
-- ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations" ON business_cards FOR ALL USING (true);
