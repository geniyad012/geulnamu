-- groups 테이블에 is_first_time 컬럼 추가
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS is_first_time BOOLEAN DEFAULT FALSE;

-- 기존 데이터 업데이트 (attendances 테이블의 is_first_time 값을 기반으로)
-- 이 쿼리는 안전하게 기존 groups 데이터를 업데이트합니다
UPDATE groups
SET is_first_time = attendances.is_first_time
FROM attendances
WHERE groups.member_name = attendances.name
  AND groups.event_id = attendances.event_id;
