-- groups 테이블에 book_genre 컬럼 추가
ALTER TABLE groups ADD COLUMN IF NOT EXISTS book_genre VARCHAR(50);
