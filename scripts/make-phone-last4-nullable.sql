-- questions 테이블의 phone_last4 컬럼을 nullable로 변경
ALTER TABLE questions 
ALTER COLUMN phone_last4 DROP NOT NULL;

-- 기존 NOT NULL 데이터가 있다면 NULL로 업데이트 (선택사항)
UPDATE questions 
SET phone_last4 = NULL 
WHERE phone_last4 = '';
