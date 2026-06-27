-- 조 편성 테이블 생성
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  member_name text NOT NULL,
  phone_last4 varchar(4),
  group_number integer NOT NULL,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 활성화
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공개된 조 편성을 볼 수 있음
CREATE POLICY "공개된 조 편성은 모두 볼 수 있음"
ON public.groups
FOR SELECT
USING (is_published = true);

-- 인증된 사용자는 모든 조 편성을 볼 수 있음 (관리자용)
CREATE POLICY "인증된 사용자는 모든 조를 볼 수 있음"
ON public.groups
FOR SELECT
TO authenticated
USING (true);

-- 인증된 사용자만 조 편성 추가/수정/삭제 가능
CREATE POLICY "인증된 사용자만 조 편성 추가 가능"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "인증된 사용자만 조 편성 수정 가능"
ON public.groups
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "인증된 사용자만 조 편성 삭제 가능"
ON public.groups
FOR DELETE
TO authenticated
USING (true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS groups_event_id_idx ON public.groups(event_id);
CREATE INDEX IF NOT EXISTS groups_is_published_idx ON public.groups(is_published);
