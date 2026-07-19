-- 1. Allow ma_don_hang to be NULL for wallet deposit payments
ALTER TABLE thanh_toan ALTER COLUMN ma_don_hang INT NULL;

-- 2. Add VietQR (8) to the payment method CHECK constraint
DECLARE @sql NVARCHAR(MAX);
SELECT @sql = 'ALTER TABLE thanh_toan DROP CONSTRAINT ' + QUOTENAME(name)
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('thanh_toan');
EXEC sp_executesql @sql;
ALTER TABLE thanh_toan ADD CONSTRAINT CK_thanh_toan_phuong_thuc CHECK (phuong_thuc IN (1,2,3,4,5,6,7,8));

-- 3. Fix mo_ta encoding in giao_dich_vi: VARCHAR -> NVARCHAR
ALTER TABLE giao_dich_vi ALTER COLUMN mo_ta NVARCHAR(500) NULL;

-- 4. Fix existing corrupted mo_ta data (reconstruct from known patterns)
UPDATE giao_dich_vi SET mo_ta = N'Hoàn tiền trả hàng - Đơn #' + CAST(ma_don_hang AS NVARCHAR(10))
WHERE mo_ta LIKE N'Hoàn ti?n tr? hàng%' AND ma_don_hang IS NOT NULL;

UPDATE giao_dich_vi SET mo_ta = N'Hoàn tiền hủy đơn #' + CAST(ma_don_hang AS NVARCHAR(10))
WHERE mo_ta LIKE N'Hoàn ti?n h?y %' AND ma_don_hang IS NOT NULL;

UPDATE giao_dich_vi SET mo_ta = REPLACE(mo_ta, N'N?p ti?n qua ', N'Nạp tiền qua ')
WHERE mo_ta LIKE N'N?p ti?n qua%';
