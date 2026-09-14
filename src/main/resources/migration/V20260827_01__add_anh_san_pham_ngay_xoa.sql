-- Add soft-delete (hide) support for product images
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'anh_san_pham' AND COLUMN_NAME = 'ngay_xoa'
)
BEGIN
    ALTER TABLE anh_san_pham ADD ngay_xoa DATETIME2 NULL;
END
