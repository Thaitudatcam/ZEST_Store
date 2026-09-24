-- SQL Server. Run once when deploying per-customer coupon usage limits.
-- phieu_giam_gia.so_luong becomes the configured limit for EACH customer.
SET NOCOUNT ON;

IF OBJECT_ID('zest_schema_migration', 'U') IS NULL
BEGIN
    CREATE TABLE zest_schema_migration (
        version VARCHAR(100) NOT NULL PRIMARY KEY,
        applied_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END;

IF NOT EXISTS (SELECT 1 FROM zest_schema_migration WHERE version = 'V20260923_01')
BEGIN
    BEGIN TRANSACTION;

    -- On a brand-new database Hibernate creates the application tables after
    -- Flyway. There is no legacy data to backfill in that case.
    IF OBJECT_ID('phieu_giam_gia', 'U') IS NOT NULL
       AND OBJECT_ID('voucher_nguoi_dung', 'U') IS NOT NULL
       AND OBJECT_ID('coupon_usage_log', 'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH('voucher_nguoi_dung', 'so_luong_con_lai') IS NULL
        BEGIN
            ALTER TABLE voucher_nguoi_dung ADD so_luong_con_lai INT NULL;
        END;

-- Reconstruct the originally configured quantity from the legacy shared pool.
-- The legacy implementation deducted one unit for every non-revoked allocation,
-- plus anonymous/POS uses which did not create a user-voucher row.
;WITH voucher_deductions AS (
    SELECT ma_phieu_giam_gia, COUNT_BIG(*) AS deducted
    FROM voucher_nguoi_dung
    WHERE trang_thai IN (0, 1, 2)
    GROUP BY ma_phieu_giam_gia
), anonymous_deductions AS (
    SELECT p.ma_phieu_giam_gia, COUNT_BIG(*) AS deducted
    FROM coupon_usage_log l
    JOIN phieu_giam_gia p ON p.ma_code = l.ma_code
    WHERE l.ma_nguoi_dung IS NULL AND (l.loai IS NULL OR l.loai <> 'RESTORED')
    GROUP BY p.ma_phieu_giam_gia
)
SELECT p.ma_phieu_giam_gia,
       CASE WHEN p.so_luong IS NULL THEN NULL
            ELSE p.so_luong
                 + CONVERT(INT, ISNULL(v.deducted, 0))
                 + CONVERT(INT, ISNULL(a.deducted, 0)) END AS configured_limit
INTO #coupon_limits
FROM phieu_giam_gia p
LEFT JOIN voucher_deductions v ON v.ma_phieu_giam_gia = p.ma_phieu_giam_gia
LEFT JOIN anonymous_deductions a ON a.ma_phieu_giam_gia = p.ma_phieu_giam_gia;

UPDATE p
SET p.so_luong = l.configured_limit
FROM phieu_giam_gia p
JOIN #coupon_limits l ON l.ma_phieu_giam_gia = p.ma_phieu_giam_gia;

UPDATE v
SET v.so_luong_con_lai =
    CASE WHEN l.configured_limit IS NULL THEN NULL
         WHEN v.trang_thai = 2 THEN
              CASE WHEN l.configured_limit > 0 THEN l.configured_limit - 1 ELSE 0 END
         ELSE l.configured_limit END
FROM voucher_nguoi_dung v
JOIN #coupon_limits l ON l.ma_phieu_giam_gia = v.ma_phieu_giam_gia
WHERE v.trang_thai IN (0, 1, 2);

-- A previously "used" voucher now remains active while it still has personal uses.
UPDATE voucher_nguoi_dung
SET trang_thai = 1
WHERE trang_thai = 2 AND (so_luong_con_lai IS NULL OR so_luong_con_lai > 0);

        DROP TABLE #coupon_limits;
    END;

    INSERT INTO zest_schema_migration(version) VALUES ('V20260923_01');
    COMMIT TRANSACTION;
END;
