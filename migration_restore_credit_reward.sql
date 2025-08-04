-- Migration: Restore creditReward column to tbl_missions
-- 이미 제거된 경우 다시 추가

-- creditReward 컬럼 다시 추가 (이미 있는 경우 무시됨)
ALTER TABLE tbl_missions 
ADD COLUMN IF NOT EXISTS creditReward INT DEFAULT 0 AFTER co2ReductionAmount;

-- 기존 미션들의 creditReward를 co2ReductionAmount 기반으로 설정
UPDATE tbl_missions 
SET creditReward = ROUND(co2ReductionAmount) 
WHERE creditReward = 0 OR creditReward IS NULL;

-- 미션 데이터 확인
SELECT 
    id, 
    title, 
    co2ReductionAmount,
    creditReward
FROM tbl_missions
LIMIT 10;
