-- 2024년 9월 출석 데이터 삭제
DELETE FROM attendances 
WHERE created_at >= '2024-09-01 00:00:00' 
  AND created_at < '2024-10-01 00:00:00';
