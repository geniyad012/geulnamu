-- RLS 정책 수정: groups 테이블에 대한 읽기/쓰기 권한 추가
-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON groups;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON groups;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON groups;

-- 모든 사용자에게 읽기 권한 부여 (공개된 조 편성만)
CREATE POLICY "Enable read access for published groups"
ON groups FOR SELECT
USING (is_published = true);

-- 모든 작업에 대한 전체 권한 부여 (관리자용)
CREATE POLICY "Enable all access for service role"
ON groups FOR ALL
USING (true)
WITH CHECK (true);

-- 또는 RLS를 완전히 비활성화 (개발 단계에서만 권장)
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
