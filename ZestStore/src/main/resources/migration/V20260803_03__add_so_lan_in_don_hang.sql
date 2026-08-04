-- Thêm cột đếm số lần in hóa đơn của đơn hàng (dùng cho chức năng In / In lại).
SET QUOTED_IDENTIFIER ON;
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.don_hang') AND name = N'so_lan_in'
)
BEGIN
    ALTER TABLE dbo.don_hang ADD so_lan_in INT NOT NULL CONSTRAINT DF_don_hang_so_lan_in DEFAULT 0;
END