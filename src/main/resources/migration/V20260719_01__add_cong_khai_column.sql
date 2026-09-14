-- Add cong_khai column (Hibernate will create this via ddl-auto=update)
-- Run this AFTER application startup creates the column:

UPDATE phieu_giam_gia SET cong_khai = 1
WHERE ngay_xoa IS NULL
  AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= GETDATE());
