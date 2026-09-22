-- SQL Server. Run once before deploying this version.
-- Legacy NULL values conflict with the UNIQUE constraint during order INSERT.
SET NOCOUNT ON;

UPDATE don_hang
SET ma_don_hang_code = CONCAT('LEGACY-', ma_don_hang)
WHERE ma_don_hang_code IS NULL;

-- Keep the existing column definition and UNIQUE constraint intact. New rows
-- are protected by DonHang.onCreate(), which supplies a non-NULL temporary
-- code before the identity-based DHxxxx code is assigned.
