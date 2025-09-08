-- RLS 정책을 올바르게 수정하여 저장 문제를 근본적으로 해결
-- Supabase SQL Editor에서 실행하세요

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can view public cards" ON business_cards;
DROP POLICY IF EXISTS "Users can create own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can update own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON business_cards;

-- 수정된 정책 생성 (::text 제거)
CREATE POLICY "Users can view own cards" ON business_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public cards" ON business_cards
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own cards" ON business_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON business_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON business_cards
    FOR DELETE USING (auth.uid() = user_id);

-- 정책이 올바르게 적용되었는지 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'business_cards';
