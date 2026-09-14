-- 1. Fix ten_chuong_trinh encoding: ensure column is NVARCHAR
-- Run this AFTER application starts (Hibernate adds ngay_ket_thuc column):
ALTER TABLE chuong_trinh_qua_tang ALTER COLUMN ten_chuong_trinh NVARCHAR(200) NOT NULL;

-- 2. Add ngay_ket_thuc column (Hibernate will create this via ddl-auto=update)
-- Run ONLY if column doesn't exist:
-- ALTER TABLE chuong_trinh_qua_tang ADD ngay_ket_thuc DATETIME2;
